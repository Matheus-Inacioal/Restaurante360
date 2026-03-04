import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/lib/firebase/firebase-admin';

const superAdminSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório"),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    senha: z.string().min(6, "Senha muito curta. Min 6 caracteres"),
});

export async function POST(req: Request) {
    // PROTEÇÃO: Só permitir em modo de desenvolvimento
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({
            ok: false,
            code: "NOT_FOUND",
            message: "Rota não encontrada ou não permitida neste ambiente."
        }, { status: 404 });
    }

    try {
        const body = await req.json();

        // Validar e Sanitizar input
        const parseResult = superAdminSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: 'Dados inválidos.',
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const data = parseResult.data;
        const emailLimpo = data.email;

        // 1. Criar ou Obter usuário no Firebase Auth
        let uid = "";
        try {
            console.log(`[BOOTSTRAP_SUPERADMIN] Tentando criar usuário no Auth: ${emailLimpo}`);
            const userRecord = await adminAuth.createUser({
                email: emailLimpo,
                password: data.senha,
                displayName: data.nome,
            });
            uid = userRecord.uid;
        } catch (authError: any) {
            if (authError.code === "auth/email-already-exists") {
                console.log(`[BOOTSTRAP_SUPERADMIN] Usuário já existe no Auth. Buscando UID...`);
                const userRecord = await adminAuth.getUserByEmail(emailLimpo);
                uid = userRecord.uid;

                // Opcional: Atualiza a senha pro que foi mandado no body
                await adminAuth.updateUser(uid, { password: data.senha });
            } else {
                console.error("[BOOTSTRAP_SUPERADMIN] Erro no Auth:", authError);
                throw authError;
            }
        }

        console.log(`[BOOTSTRAP_SUPERADMIN] UID resolvido: ${uid}. Gerando perfil Firestore no papel SISTEMA...`);

        // 2. Criar/Atualizar Perfil Global no Firestore
        const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);

        await usuarioGlobalRef.set({
            uid: uid,
            email: emailLimpo,
            nome: data.nome,
            papelPortal: "SISTEMA", // <--- Garantindo ROOT permission
            ativo: true,
            criadoEm: adminDb.FieldValue.serverTimestamp(),
            atualizadoEm: adminDb.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`[BOOTSTRAP_SUPERADMIN] Sucesso.`);

        return NextResponse.json({
            ok: true,
            uid: uid,
            email: emailLimpo,
            mensagem: "Superadmin (SISTEMA) provisionado com sucesso. Faça login."
        }, { status: 201 });

    } catch (error: any) {
        console.error("[BOOTSTRAP_SUPERADMIN] Erro fatal:", error);
        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: error.message || "Erro interno do servidor ao provisionar Superadmin."
        }, { status: 500 });
    }
}
