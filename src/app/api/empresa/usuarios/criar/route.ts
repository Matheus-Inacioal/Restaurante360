import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { jsonOk, jsonErro, mapearZodError } from '@/server/http/respostas';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';

const usuarioEmpresaSchema = z.object({
    nome: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres.").max(80),
    email: z.string().trim().toLowerCase().email("Por favor, insira um email válido."),
    papel: z.enum(['gestor', 'bar', 'pia', 'cozinha', 'producao', 'garcon']),
});

export async function POST(req: Request) {
    try {
        const authResult = await garantirAcessoEmpresa(req);
        if (authResult instanceof Response) return authResult;

        const body = await req.json();

        const parseResult = usuarioEmpresaSchema.safeParse(body);
        if (!parseResult.success) {
            return mapearZodError(parseResult.error);
        }

        const data = parseResult.data;
        const empresaId = authResult.sessao.empresaId!;

        if (typeof adminDb.collection !== 'function') {
            return jsonErro("Admin DB indisponível no ambiente abstrato.", "FIREBASE_ADMIN_ERROR", 500);
        }

        // Tenta criar o usuário no auth global
        const emailLimpo = data.email;
        const senhaGerada = Math.random().toString(36).slice(-8) + "A1@";

        let uid = "";
        let isNewUser = false;

        try {
            const userRecord = await adminAuth.createUser({
                email: emailLimpo,
                password: senhaGerada,
                displayName: data.nome,
            });
            uid = userRecord.uid;
            isNewUser = true;
        } catch (authError: any) {
            if (authError.code === "auth/email-already-exists") {
                // Se já existe, pega o UID desse usuário
                const existingUser = await adminAuth.getUserByEmail(emailLimpo);
                uid = existingUser.uid;
                isNewUser = false;
            } else {
                throw authError;
            }
        }

        const batch = adminDb.batch();

        // Verifica se o perfil global existe independentemente de isNewUser
        // Isso previne que contas "fantasmas" no Auth que falharam em salvar no Firestore
        // fiquem para sempre sem registro ao tentar adicionar novamente.
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
        const globalDoc = await usuarioGlobalRef.get();

        if (!globalDoc.exists) {
            batch.set(usuarioGlobalRef, {
                uid: uid,
                email: emailLimpo,
                nome: data.nome,
                papelPortal: "OPERACIONAL",
                empresaId: empresaId,
                ativo: true,
                criadoEm: new Date(),
                atualizadoEm: new Date()
            });
        }

        // Criar registro na /empresas/{id}/usuarios (Tenant isolation)
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
            nome: data.nome,
            email: emailLimpo,
            papel: data.papel,
            ativo: true,
            criadoEm: new Date()
        });

        // Registrar auditoria
        const auditoriaRef = adminDb.collection("auditoria").doc();
        batch.set(auditoriaRef, {
            empresaId: empresaId,
            entidade: "USUARIO_EMPRESA",
            acao: "CRIAR",
            entidadeId: uid,
            criadoPor: authResult.sessao.uid,
            detalhes: `Usuário '${data.nome}' adicionado à equipe como '${data.papel}'`,
            criadoEm: new Date()
        });

        try {
            await batch.commit();
        } catch (dbError: any) {
            console.error("[CRIAR_USUARIO_EMPRESA] Erro fatal no Firestore Transaction:", dbError);
            if (isNewUser && uid) {
                console.warn(`[CRIAR_USUARIO_EMPRESA] Revertendo criação de Auth e apagando órfão UID: ${uid}`);
                await adminAuth.deleteUser(uid).catch(() => { });
            }
            return jsonErro(`Falha ao salvar usuário no banco: ${dbError.message}`, "FIRESTORE_ERROR", 500);
        }

        // TODO: Enviar email convidando com `senhaGerada` (para `isNewUser = true`)

        return jsonOk({
            uid,
            isNewUser
        }, 201);

    } catch (error: any) {
        console.error("[CRIAR_USUARIO_EMPRESA] Erro:", error);

        // Fail-safe: Se o database reverter ou falhar atômica, tentamos apagar a conta orfã.
        // Como o req.json() já foi lido e não pode ser re-lido nativamente no catch se falhou antes, 
        // vamos garantir que pelo menos o erro 500 retorne corretamente para a UI.

        return jsonErro("Falha interna ao criar usuário da empresa.", "INTERNAL_ERROR", 500);
    }
}
