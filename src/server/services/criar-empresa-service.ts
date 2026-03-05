import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { gerarSenhaTemporaria } from '@/server/utils/gerar-senha-temporaria';

export interface CriarEmpresaInput {
    nome: string;
    cnpj: string;
    responsavelNome: string;
    email: string;
    whatsappResponsavel: string;
    planoId: string;
    diasTrial: number;
    vencimentoPrimeiraCobrancaEm?: string;
}

export interface CriarEmpresaResult {
    ok: boolean;
    empresaId?: string;
    usuarioId?: string;
    senhaTemporaria?: string;
    message?: string;
    code?: string;
}

/**
 * Serviço responsável por orquestrar a criação de uma nova empresa (Tenant),
 * do usuário responsável no Firebase Auth e dos perfis nas coleções do Firestore.
 */
export async function criarEmpresaService(data: CriarEmpresaInput): Promise<CriarEmpresaResult> {
    try {
        console.log(`[CRIAR_EMPRESA_SERVICE] Iniciando provisionamento para: ${data.nome} (${data.cnpj})`);

        // Preparar datas
        const hoje = new Date();
        const trialFim = new Date(hoje);
        trialFim.setDate(hoje.getDate() + data.diasTrial);

        // Gera IDs do Firestore antecipadamente
        const empresaRef = adminDb.collection("empresas").doc();
        const empresaId = empresaRef.id;
        const assinaturaRef = adminDb.collection("financeiro_assinaturas").doc();
        const aceiteRef = adminDb.collection("financeiro_aceites").doc();
        const aceiteToken = aceiteRef.id;

        // 1. Gerar senha e criar o usuário no Firebase Auth
        const senhaGerada = gerarSenhaTemporaria();
        let userRecord;

        try {
            userRecord = await adminAuth.createUser({
                email: data.email,
                password: senhaGerada,
                displayName: data.responsavelNome,
            });
        } catch (authError: any) {
            console.error("[CRIAR_EMPRESA_SERVICE] Erro no Auth:", authError);
            if (authError.code === "auth/email-already-exists") {
                return {
                    ok: false,
                    code: "EMAIL_JA_EXISTE",
                    message: "Este e-mail já está em uso por outro usuário."
                };
            }
            throw authError; // Lança para o catch externo
        }

        const uid = userRecord.uid;

        // 2. Transação Atômica (Batch write) no Firestore
        const batch = adminDb.batch();

        // 2.1 Criar empresa (Tenant)
        batch.set(empresaRef, {
            nome: data.nome,
            cnpj: data.cnpj,
            responsavelEmail: data.email,
            whatsappResponsavel: data.whatsappResponsavel,
            status: "TRIAL_ATIVO",
            criadoEm: FieldValue.serverTimestamp(),
            atualizadoEm: FieldValue.serverTimestamp() // Mantendo a consistência pedida
        });

        // 2.2 Criar perfil global em "usuarios"
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
        batch.set(usuarioGlobalRef, {
            uid: uid,
            email: data.email,
            nome: data.responsavelNome,
            papelPortal: "EMPRESA",
            papelEmpresa: "GESTOR",
            empresaId: empresaId,
            ativo: true,
            criadoEm: FieldValue.serverTimestamp(),
            atualizadoEm: FieldValue.serverTimestamp()
        });

        // 2.3 Criar referência do usuário dentro da empresa (opcional para alguns sistemas, mas mantido pra segurança local do tenant)
        const usuarioEmpresaRef = empresaRef.collection("usuarios").doc(uid);
        batch.set(usuarioEmpresaRef, {
            uid: uid,
            nome: data.responsavelNome,
            papel: "GESTOR",
            ativo: true,
            criadoEm: FieldValue.serverTimestamp()
        });

        // 2.4 Criar plano de assinatura associado
        batch.set(assinaturaRef, {
            empresaId: empresaId,
            plano: data.planoId,
            status: "TRIAL",
            diasTrial: data.diasTrial,
            criadoEm: FieldValue.serverTimestamp()
        });

        // 2.5 Criar aceite pendente
        batch.set(aceiteRef, {
            empresaId: empresaId,
            token: aceiteToken,
            status: "PENDENTE",
            expiraEm: trialFim,
            criadoEm: FieldValue.serverTimestamp()
        });

        // Efetivar a gravação atômica
        await batch.commit();
        console.log(`[CRIAR_EMPRESA_SERVICE] Transação do banco concluída. EmpresaId: ${empresaId}, UID: ${uid}`);

        return {
            ok: true,
            empresaId: empresaId,
            usuarioId: uid,
            senhaTemporaria: senhaGerada // Fundamental para a mensageria subsequente
        };

    } catch (error: any) {
        console.error("[CRIAR_EMPRESA_SERVICE] Falha interna:", error);

        const errMsg = error?.message || "";
        if (errMsg.includes("default credentials") || errMsg.includes("Could not load the default credentials")) {
            return {
                ok: false,
                code: "FIREBASE_ADMIN_CREDENTIALS",
                message: "Firebase Admin não configurado no ambiente."
            };
        }

        return {
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Falha na criação da empresa ou banco de dados."
        };
    }
}
