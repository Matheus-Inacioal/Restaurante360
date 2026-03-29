import "server-only";
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { repositorioEmpresasAdmin } from '@/server/repositories/repositorio-empresas';
import { repositorioUsuariosAdmin } from '@/server/repositories/repositorio-usuarios';
import { definirClaimsUsuario } from '@/server/auth/definirClaimsUsuario';

export interface CriarEmpresaInput {
    nomeEmpresa: string;
    cnpj: string;
    nomeResponsavel: string;
    emailResponsavel: string;
    whatsappResponsavel: string;
    planoId: string;
    diasTrial: number;
    vencimentoPrimeiraCobrancaEm?: string;
}

export interface CriarEmpresaResult {
    ok: boolean;
    empresaId?: string;
    usuarioId?: string;
    emailResponsavel?: string;
    linkPrimeiroAcesso?: string;
    statusEmpresa?: string;
    message?: string;
    code?: string;
    originalError?: any;
}

const APP_URL = process.env.APP_URL || "http://localhost:9002";

/**
 * Serviço responsável por orquestrar a criação de uma nova empresa (Tenant),
 * do usuário responsável no Firebase Auth e dos perfis nas coleções do Firestore.
 */
export async function criarEmpresaService(data: CriarEmpresaInput): Promise<CriarEmpresaResult> {
    try {
        console.log(`[CRIAR_EMPRESA_SERVICE] Iniciando provisionamento para: ${data.nomeEmpresa} (${data.cnpj})`);

        // Preparar status da empresa com base no trial
        const statusEmpresa = data.diasTrial > 0 ? "TRIAL_ATIVO" : "ATIVA";

        // Gerar IDs do Firestore antecipadamente
        const empresaRef = adminDb.collection("empresas").doc();
        const empresaId = empresaRef.id;

        // 1. Criar o usuário no Firebase Auth (sem senha, usará o link)
        console.log("[CRIAR_EMPRESA_SERVICE] 1. Criando usuário no Firebase Auth");
        let userRecord;
        try {
            userRecord = await adminAuth.createUser({
                email: data.emailResponsavel,
                displayName: data.nomeResponsavel,
            });
        } catch (authError: any) {
            console.error("[CRIAR_EMPRESA_SERVICE] Erro no Auth:", authError);
            if (authError.code === "auth/email-already-exists") {
                return {
                    ok: false,
                    code: "EMAIL_JA_EXISTE",
                    message: "Já existe um usuário com este e-mail.",
                    originalError: authError
                };
            }
            throw authError;
        }

        const uid = userRecord.uid;
        console.log(`[CRIAR_EMPRESA_SERVICE] -> Usuário Auth criado com UID: ${uid}`);

        // 2. Transação Atômica (Batch write) no Firestore
        console.log("[CRIAR_EMPRESA_SERVICE] 2. Configurando transação no Firestore (Batch)");
        const batch = adminDb.batch();

        // 2.1 Criar empresa (Tenant)
        console.log("[CRIAR_EMPRESA_SERVICE] -> Adicionando Empresa ao batch");
        repositorioEmpresasAdmin.criarEmpresa(
            empresaId,
            {
                nomeEmpresa: data.nomeEmpresa,
                cnpj: data.cnpj,
                planoId: data.planoId,
                status: statusEmpresa,
                emailResponsavel: data.emailResponsavel,
                nomeResponsavel: data.nomeResponsavel,
                whatsappResponsavel: data.whatsappResponsavel,
                diasTrial: data.diasTrial,
                vencimentoPrimeiraCobrancaEm: data.vencimentoPrimeiraCobrancaEm,
            },
            batch
        );

        // 2.2 Criar perfil global em "usuarios"
        console.log("[CRIAR_EMPRESA_SERVICE] -> Adicionando Perfil Global ao batch");
        repositorioUsuariosAdmin.criarPerfilGlobal(
            {
                uid,
                email: data.emailResponsavel,
                nome: data.nomeResponsavel,
                papelPortal: "EMPRESA",
                papelEmpresa: "GESTOR",
                empresaId,
                ativo: true,
            },
            batch
        );

        // 2.3 Referência do usuário dentro da empresa
        console.log("[CRIAR_EMPRESA_SERVICE] -> Adicionando Vínculo Usuário-Empresa ao batch");
        repositorioUsuariosAdmin.criarUsuarioEmpresa(
            {
                uid,
                empresaId,
                email: data.emailResponsavel,
                nome: data.nomeResponsavel,
                papel: "GESTOR",
                ativo: true,
            },
            batch
        );

        // Efetivar a gravação atômica
        console.log("[CRIAR_EMPRESA_SERVICE] 3. Efetuando o commit da transação no Firestore...");
        await batch.commit();
        console.log(`[CRIAR_EMPRESA_SERVICE] Transação concluída com sucesso. EmpresaId: ${empresaId}, UID: ${uid}`);

        // 2.4 Setar custom claims no Firebase Auth para o gestor
        // Garante que o token do gestor terá empresaId, papelPortal e papelEmpresa
        try {
            await definirClaimsUsuario(uid, {
                empresaId,
                papelPortal: "EMPRESA",
                papelEmpresa: "GESTOR",
            });
            console.log(`[CRIAR_EMPRESA_SERVICE] -> Claims do gestor definidas com sucesso.`);
        } catch (claimsError) {
            // Não-fatal: o fallback do garantirAcessoEmpresa buscará no Firestore
            console.warn("[CRIAR_EMPRESA_SERVICE] Falha ao setar claims do gestor (não-fatal):", claimsError);
        }

        // 3. Gerar link de primeiro acesso (Firebase Auth reset link)
        console.log("[CRIAR_EMPRESA_SERVICE] 4. Gerando link de primeiro acesso");
        let linkPrimeiroAcesso: string | undefined;
        try {
            linkPrimeiroAcesso = await adminAuth.generatePasswordResetLink(data.emailResponsavel, {
                url: `${APP_URL}/login`,
            });
            console.log("[CRIAR_EMPRESA_SERVICE] -> Link gerado com sucesso.");
        } catch (linkError) {
            console.warn("[CRIAR_EMPRESA_SERVICE] Não foi possível gerar link de convite:", linkError);
        }

        console.log(`[CRIAR_EMPRESA_SERVICE] 5. Fluxo de Criação Finalizado com Sucesso para empresa ${data.nomeEmpresa}`);

        return {
            ok: true,
            empresaId,
            usuarioId: uid,
            emailResponsavel: data.emailResponsavel,
            statusEmpresa,
            linkPrimeiroAcesso,
        };

    } catch (error: any) {
        console.error("[CRIAR_EMPRESA_SERVICE] Falha interna não tratada:", error);

        // Fail-safe: Se o usuário foi criado no Firebase Auth mas o banco falhou, deletar do Auth.
        if (data.emailResponsavel) {
            try {
                const userCorrompido = await adminAuth.getUserByEmail(data.emailResponsavel);
                if (userCorrompido) {
                    await adminAuth.deleteUser(userCorrompido.uid);
                    console.log(`[CRIAR_EMPRESA_SERVICE] Usuário orfão (${userCorrompido.uid}) apagado por falha no Firestore.`);
                }
            } catch (cleanupError) {
                console.warn("[CRIAR_EMPRESA_SERVICE] Falha ao tentar limpar o User do Auth após erro do banco:", cleanupError);
            }
        }

        const errMsg = error?.message || "";
        if (errMsg.includes("default credentials") || errMsg.includes("Could not load the default credentials") || errMsg.includes("FIREBASE_ADMIN_NOT_CONFIGURED")) {
            return {
                ok: false,
                code: "FIREBASE_ADMIN_CREDENTIALS",
                message: "Firebase Admin não configurado corretamente.",
                originalError: error
            };
        }

        return {
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Falha na criação da empresa ou banco de dados.",
            originalError: error
        };
    }
}
