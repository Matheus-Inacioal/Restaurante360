import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminAuth } from '@/server/firebase/admin';
import { normalizarCNPJ, normalizarWhatsApp } from '@/lib/formatadores/formato';

const tenantSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório").max(120),
    cnpj: z.string().min(14, "CNPJ precisa ter no mínimo 14 números"),
    responsavelNome: z.string().trim().min(2, "Nome do responsável é obrigatório").max(80),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    whatsappResponsavel: z.string().min(10, "WhatsApp precisa ter no mínimo 10 números"),
    planoId: z.string().min(1, "ID do plano é obrigatório"),
    diasTrial: z.number().int().min(0, "Dias trial devem ser maiores ou iguais a 0").default(7),
    vencimentoPrimeiraCobrancaEm: z.string().optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validar payload com Zod
        const parseResult = tenantSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: 'Dados inválidos ou incompletos.',
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const data = parseResult.data;
        const cnpjLimpo = normalizarCNPJ(data.cnpj);
        const wappLimpo = normalizarWhatsApp(data.whatsappResponsavel);
        const emailLimpo = data.email;
        const plano = data.planoId;
        const diasTrial = data.diasTrial;

        if (typeof adminDb.collection !== 'function') {
            return NextResponse.json({
                ok: false,
                code: "FIREBASE_ADMIN_ERROR",
                message: "Painel Administrativo do backend desconectado. Configure o FIREBASE_ADMIN_PRIVATE_KEY no arquivo .env.local para permitir a criação de empresas."
            }, { status: 500 });
        }

        // Validar e Sanitizar vencimentoPrimeiraCobrancaEm
        const hoje = new Date();
        const trialFim = new Date(hoje);
        trialFim.setDate(hoje.getDate() + diasTrial);

        console.log(`[CRIAR_EMPRESA] Iniciando provisionamento para: ${data.nome} (${cnpjLimpo})`);

        // Cria IDs
        const empresaRef = adminDb.collection("empresas").doc();
        const empresaId = empresaRef.id;
        const assinaturaRef = adminDb.collection("financeiro_assinaturas").doc();
        const aceiteRef = adminDb.collection("financeiro_aceites").doc();
        const aceiteToken = aceiteRef.id;

        // 2. Criar usuário no Firebase Auth
        const senhaGerada = Math.random().toString(36).slice(-8) + "A1@";
        let userRecord;
        try {
            userRecord = await adminAuth.createUser({
                email: emailLimpo,
                password: senhaGerada,
                displayName: data.responsavelNome,
            });
        } catch (authError: any) {
            console.error("[CRIAR_EMPRESA] Erro no Auth:", authError);
            if (authError.code === "auth/email-already-exists") {
                return NextResponse.json({ ok: false, code: "EMAIL_JA_EXISTE", message: "Este e-mail já está em uso por outro usuário." }, { status: 400 });
            }
            throw authError; // repassa pro catch geral
        }

        const uid = userRecord.uid;

        // Batch write para garantir transação atômica
        const batch = adminDb.batch();

        // 1. Criar empresa no Firestore
        batch.set(empresaRef, {
            nome: data.nome,
            cnpj: cnpjLimpo,
            responsavelEmail: emailLimpo,
            whatsappResponsavel: wappLimpo,
            status: "TRIAL_ATIVO",
            criadoEm: FieldValue.serverTimestamp()
        });

        // 3. Criar perfil global
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
        batch.set(usuarioGlobalRef, {
            uid: uid,
            email: emailLimpo,
            nome: data.responsavelNome,
            papelPortal: "EMPRESA",
            papelEmpresa: "GESTOR",
            empresaId: empresaId,
            ativo: true,
            criadoEm: FieldValue.serverTimestamp(),
            atualizadoEm: FieldValue.serverTimestamp()
        });

        // 4. Criar usuário dentro da empresa
        const usuarioEmpresaRef = empresaRef.collection("usuarios").doc(uid);
        batch.set(usuarioEmpresaRef, {
            uid: uid,
            nome: data.responsavelNome,
            papel: "GESTOR",
            ativo: true,
            criadoEm: FieldValue.serverTimestamp()
        });

        // 5. Criar assinatura
        batch.set(assinaturaRef, {
            empresaId: empresaId,
            plano: plano,
            status: "TRIAL",
            diasTrial: diasTrial,
            criadoEm: FieldValue.serverTimestamp()
        });

        // 6. Criar aceite
        batch.set(aceiteRef, {
            empresaId: empresaId,
            token: aceiteToken,
            status: "PENDENTE",
            expiraEm: trialFim,
            criadoEm: FieldValue.serverTimestamp()
        });

        // Comita tudo
        await batch.commit();

        console.log(`[CRIAR_EMPRESA] Sucesso. EmpresaId: ${empresaId}, UID: ${uid}`);

        const origin = req.headers.get("origin") ?? new URL(req.url).origin;
        const aceiteUrl = `${origin}/aceite/${aceiteToken}`;

        // (Opcional) Disparar emails/wapp de onboardings reais depois...
        fetch(`${origin}/api/mensagens/email/aceite`, {
            method: 'POST',
            body: JSON.stringify({ email: emailLimpo, tokenAceite: aceiteToken, empresaId: empresaId, senhaTemporaria: senhaGerada }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error("[CRIAR_EMPRESA] Erro disparando email fallback", e));

        // 7. Retornar resposta
        return NextResponse.json({
            ok: true,
            empresaId: empresaId,
            aceiteUrl: aceiteUrl,
            emailCriado: emailLimpo,
            senhaGerada: senhaGerada
        }, { status: 201 });

    } catch (error: any) {
        console.error("[CRIAR_EMPRESA] Erro fatal:", error);

        const errMsg = error?.message || "";
        if (errMsg.includes("default credentials") || errMsg.includes("Could not load the default credentials")) {
            return NextResponse.json({
                ok: false,
                code: "FIREBASE_ADMIN_CREDENTIALS",
                message: "Firebase Admin não configurado no ambiente. Verifique FIREBASE_* no .env.local."
            }, { status: 500 });
        }

        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: errMsg || "Erro interno do servidor ao provisionar empresa."
        }, { status: 500 });
    }
}
