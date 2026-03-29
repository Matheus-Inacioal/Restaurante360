import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { definirClaimsUsuario } from '@/server/auth/definirClaimsUsuario';
import { servicoEmail } from '@/server/servicos/servico-email';

/**
 * Schema de validação para criação de colaborador.
 * Papéis aceitos: gestor, operacional, bar, pia, cozinha, producao, garcon.
 */
const criarColaboradorSchema = z.object({
    nome: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres.").max(80),
    email: z.string().trim().toLowerCase().email("Por favor, insira um email válido."),
    papel: z.enum(['gestor', 'operacional', 'bar', 'pia', 'cozinha', 'producao', 'garcon']),
});

/**
 * Gera uma senha aleatória forte com 20 caracteres.
 * Inclui letras maiúsculas, minúsculas, números e caracteres especiais.
 * Esta senha NÃO é retornada ao cliente — o colaborador usará redefinição de senha.
 */
function gerarSenhaForte(): string {
    const bytes = randomBytes(20);
    const base = bytes.toString('base64url');
    // Garante complexidade: adiciona maiúscula, número e especial
    return `${base}A1@x`;
}

export async function POST(req: Request) {
    try {
        // 1. Validar sessão e acesso à empresa
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const sessao = authResult.sessao;
        const empresaId = sessao.empresaId!;

        // 2. Validar que o chamador é gestor (papelPortal EMPRESA ou SISTEMA)
        const papelPermitido = sessao.papelPortal === 'EMPRESA' || sessao.papelPortal === 'SISTEMA';
        if (!papelPermitido) {
            return jsonErro(
                "Apenas gestores podem criar colaboradores.",
                "FORBIDDEN",
                403
            );
        }

        // 3. Validar dados de entrada
        const body = await req.json();
        const parseResult = criarColaboradorSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const dados = parseResult.data;

        if (typeof adminDb.collection !== 'function') {
            return jsonErro("Admin DB indisponível no ambiente abstrato.", "FIREBASE_ADMIN_ERROR", 500);
        }

        // 4. Criar ou obter usuário no Firebase Auth
        const emailLimpo = dados.email;
        const senhaForte = gerarSenhaForte();

        let uid = "";
        let isNewUser = false;

        try {
            const userRecord = await adminAuth.createUser({
                email: emailLimpo,
                password: senhaForte,
                displayName: dados.nome,
            });
            uid = userRecord.uid;
            isNewUser = true;
        } catch (authError: any) {
            if (authError.code === "auth/email-already-exists") {
                // Se já existe no Auth, pega o UID
                const existingUser = await adminAuth.getUserByEmail(emailLimpo);
                uid = existingUser.uid;
                isNewUser = false;
            } else {
                throw authError;
            }
        }

        // 5. Criar registros no Firestore (batch atômico)
        const batch = adminDb.batch();

        // 5a. Perfil global em usuarios/{uid}
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
        const globalDoc = await usuarioGlobalRef.get();

        if (!globalDoc.exists) {
            batch.set(usuarioGlobalRef, {
                uid: uid,
                email: emailLimpo,
                nome: dados.nome,
                papelPortal: "OPERACIONAL",
                papelEmpresa: dados.papel.toUpperCase(),
                empresaId: empresaId,
                gestorId: sessao.uid,
                ativo: true,
                criadoEm: new Date(),
                atualizadoEm: new Date()
            });
        } else {
            // Se perfil global já existe mas sem empresaId, atualiza vínculo
            const globalData = globalDoc.data();
            if (!globalData?.empresaId) {
                batch.update(usuarioGlobalRef, {
                    empresaId: empresaId,
                    gestorId: sessao.uid,
                    papelPortal: "OPERACIONAL",
                    papelEmpresa: dados.papel.toUpperCase(),
                    atualizadoEm: new Date()
                });
            }
        }

        // 5b. Registro na subcoleção empresas/{empresaId}/usuarios/{uid}
        const usuarioTenantRef = adminDb
            .collection("empresas")
            .doc(empresaId)
            .collection("usuarios")
            .doc(uid);

        const tenantDoc = await usuarioTenantRef.get();
        if (tenantDoc.exists) {
            return jsonErro("Usuário já faz parte da sua equipe.", "USUARIO_EXISTENTE", 400);
        }

        batch.set(usuarioTenantRef, {
            uid: uid,
            nome: dados.nome,
            email: emailLimpo,
            papel: dados.papel,
            ativo: true,
            criadoEm: new Date(),
            atualizadoEm: new Date()
        });

        // 5c. Registrar auditoria
        const auditoriaRef = adminDb.collection("auditoria").doc();
        batch.set(auditoriaRef, {
            empresaId: empresaId,
            entidade: "USUARIO_EMPRESA",
            acao: "CRIAR",
            entidadeId: uid,
            criadoPor: sessao.uid,
            detalhes: `Colaborador '${dados.nome}' adicionado à equipe como '${dados.papel}'`,
            criadoEm: new Date()
        });

        // 6. Commit atômico
        try {
            await batch.commit();
        } catch (dbError: any) {
            console.error("[CRIAR_COLABORADOR] Erro fatal no Firestore:", dbError);
            // Rollback: apagar conta Auth se foi recém-criada
            if (isNewUser && uid) {
                console.warn(`[CRIAR_COLABORADOR] Revertendo criação Auth — UID: ${uid}`);
                await adminAuth.deleteUser(uid).catch(() => { });
            }
            return jsonErro(`Falha ao salvar colaborador: ${dbError.message}`, "FIRESTORE_ERROR", 500);
        }

        // 6b. Setar custom claims no Firebase Auth para o novo colaborador
        // Isso garante que o token dele terá empresaId, papelPortal e papelEmpresa
        try {
            await definirClaimsUsuario(uid, {
                empresaId: empresaId,
                papelPortal: "OPERACIONAL",
                papelEmpresa: dados.papel.toUpperCase(),
            });
        } catch (claimsError) {
            // Não-fatal: o fallback do garantirAcessoEmpresa buscará no Firestore
            console.warn("[CRIAR_COLABORADOR] Falha ao setar claims (não-fatal):", claimsError);
        }

        // 7. Gerar link de ativação e enviar e-mail de convite
        let linkRedefinicao: string | undefined;
        try {
            linkRedefinicao = await adminAuth.generatePasswordResetLink(emailLimpo);
        } catch (linkError) {
            console.warn("[CRIAR_COLABORADOR] Não foi possível gerar link de ativação:", linkError);
        }

        // 8. Buscar nome da empresa para o template
        let nomeEmpresa: string | undefined;
        try {
            const empresaDoc = await adminDb.collection("empresas").doc(empresaId).get();
            nomeEmpresa = empresaDoc.data()?.nomeEmpresa;
        } catch {
            // Não-fatal
        }

        // 9. Disparar e-mail de convite de acesso em background
        const isDev = process.env.NODE_ENV !== "production";
        if (linkRedefinicao) {
            Promise.resolve().then(async () => {
                const resultado = await servicoEmail.enviarEmailConviteAcesso({
                    nomeUsuario: dados.nome,
                    nomeEmpresa: nomeEmpresa || "sua empresa",
                    emailDestinatario: emailLimpo,
                    linkAtivacao: linkRedefinicao!,
                    perfilUsuario: dados.papel,
                });

                if (!resultado.ok) {
                    console.warn(`[CRIAR_COLABORADOR] E-mail de convite não enviado para ${emailLimpo}:`, (resultado as any).error);
                    if (isDev) {
                        console.log(`\n📨 [DEV] LINK DE CONVITE para ${emailLimpo}:\n${linkRedefinicao}\n`);
                    }
                }
            }).catch(e => console.error("[CRIAR_COLABORADOR] Erro assíncrono no envio de convite:", e));
        }

        return jsonOk({
            uid,
            nome: dados.nome,
            email: emailLimpo,
            papel: dados.papel,
            ativo: true,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            ...(isDev && linkRedefinicao ? { linkConvite: linkRedefinicao } : {}),
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_COLABORADOR] Erro:", error);
        return jsonErro("Falha interna ao criar colaborador.", "INTERNAL_ERROR", 500);
    }
}
