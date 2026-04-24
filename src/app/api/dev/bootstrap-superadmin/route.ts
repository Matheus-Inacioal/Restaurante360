import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashSenha } from '@/server/auth/senha';

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

    return await provisionarAdmin({ nome, email, senha });
}

async function provisionarAdmin(data: any) {
    const emailLimpo = data.email.toLowerCase();
    try {
        console.log(`[BOOTSTRAP_SUPERADMIN] Tentando criar usuário no PG: ${emailLimpo}`);
        const senhaHash = await hashSenha(data.senha);

        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email: emailLimpo }
        });

        if (usuarioExistente) {
            await prisma.usuario.update({
                where: { id: usuarioExistente.id },
                data: {
                    senhaHash,
                    papel: "saasAdmin",
                    status: "ativo"
                }
            });
        } else {
            await prisma.usuario.create({
                data: {
                    email: emailLimpo,
                    nome: data.nome,
                    papel: "saasAdmin",
                    status: "ativo",
                    senhaHash,
                    mustResetPassword: false
                }
            });
        }

        return NextResponse.json({
            ok: true,
            mensagem: "Superadmin restaurado no PostgreSQL!",
            email: emailLimpo,
            senha: data.senha
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({
            ok: false,
            code: "NOT_FOUND",
            message: "Rota não permitida neste ambiente."
        }, { status: 404 });
    }

    try {
        const body = await req.json();

        const parseResult = superAdminSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: 'Dados inválidos.',
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        return await provisionarAdmin(parseResult.data);

    } catch (error: any) {
        console.error("[BOOTSTRAP_SUPERADMIN] Erro fatal:", error);
        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: error.message || "Erro interno do servidor ao provisionar Superadmin."
        }, { status: 500 });
    }
}
