import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashSenha } from '@/server/auth/senha';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';

const redefinirSenhaSchema = z.object({
    token: z.string().min(1, "Token é obrigatório."),
    novaSenha: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres.")
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parseResult = redefinirSenhaSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: "Dados inválidos.",
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { token, novaSenha } = parseResult.data;

        // 1. Buscar e validar o token
        const tokenDb = await prisma.tokenResetSenha.findUnique({
            where: { token }
        });

        if (!tokenDb) {
            return NextResponse.json({
                ok: false,
                code: "INVALID_TOKEN",
                message: "O link de redefinição de senha é inválido ou não existe."
            }, { status: 400 });
        }

        if (tokenDb.usado) {
            return NextResponse.json({
                ok: false,
                code: "USED_TOKEN",
                message: "Este link já foi utilizado."
            }, { status: 400 });
        }

        if (tokenDb.expiraEm < new Date()) {
            return NextResponse.json({
                ok: false,
                code: "EXPIRED_TOKEN",
                message: "O link de redefinição de senha expirou. Solicite um novo."
            }, { status: 400 });
        }

        // 2. Atualizar a senha (hash com bcrypt) no PostgreSQL
        const senhaHash = await hashSenha(novaSenha);

        // Transação atômica: atualizar a senha, marcar mustResetPassword=false, e marcar token como usado
        await prisma.$transaction([
            prisma.usuario.update({
                where: { id: tokenDb.usuarioId },
                data: {
                    senhaHash,
                    mustResetPassword: false,
                }
            }),
            prisma.tokenResetSenha.update({
                where: { id: tokenDb.id },
                data: {
                    usado: true
                }
            })
        ]);

        // 3. Auditar
        registrarAuditoria({
            usuarioId: tokenDb.usuarioId,
            acao: "usuario.senha.redefinida_token",
            entidade: "usuario",
            entidadeId: tokenDb.usuarioId,
        }).catch(() => null);

        return NextResponse.json({
            ok: true,
            message: "Senha atualizada com sucesso."
        }, { status: 200 });

    } catch (error: any) {
        console.error("[REDEFINIR_SENHA_ROUTE] Erro interno:", error);
        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Falha na solicitação. Tente novamente."
        }, { status: 500 });
    }
}
