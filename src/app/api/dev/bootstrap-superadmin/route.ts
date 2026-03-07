import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb, adminAuth } from '@/server/firebase/admin';

const superAdminSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório"),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    senha: z.string().min(6, "Senha muito curta. Min 6 caracteres"),
});

export async function GET(req: Request) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ ok: false, message: "Apenas DEV" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const nome = searchParams.get("nome") || "Matheus Almeida";
    const email = searchParams.get("email") || "malmeidaarruda2@gmail.com";
    const senha = searchParams.get("senha") || "admin123456";

    // Reutilizar lógica básica sem Zod error mapping para simplicidade
    return await provisionarAdmin({ nome, email, senha });
}

async function provisionarAdmin(data: any) {
    const emailLimpo = data.email.toLowerCase();
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
            const userRecord = await adminAuth.getUserByEmail(emailLimpo);
            uid = userRecord.uid;
            await adminAuth.updateUser(uid, { password: data.senha });
        } else {
            return NextResponse.json({ ok: false, error: authError.message });
        }
    }

    const usuarioGlobalRef = adminDb.collection("usuarios").doc(uid);
    await usuarioGlobalRef.set({
        uid: uid,
        email: emailLimpo,
        nome: data.nome,
        papelPortal: "SISTEMA",
        ativo: true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
    }, { merge: true });

    return NextResponse.json({
        ok: true,
        mensagem: "Superadmin restaurado!",
        email: emailLimpo,
        senha: data.senha
    }, { status: 201 });
}


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

        // 2. Criar/Atualizar Perfil Global no Firestore
        return await provisionarAdmin(data);



    } catch (error: any) {
        console.error("[BOOTSTRAP_SUPERADMIN] Erro fatal:", error);
        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: error.message || "Erro interno do servidor ao provisionar Superadmin."
        }, { status: 500 });
    }
}
