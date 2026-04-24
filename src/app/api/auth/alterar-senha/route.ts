import { NextResponse } from 'next/server';
import { obterSessao } from '@/server/auth/obterSessao';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashSenha } from '@/server/auth/senha';
import { registrarAuditoria } from '@/server/servicos/servico-auditoria';

const alterarSenhaSchema = z.object({
    novaSenha: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres")
});

export async function POST(req: Request) {
    try {
        const sessao = await obterSessao(req);

        if (!sessao) {
            return NextResponse.json({
                ok: false,
                code: "UNAUTHORIZED",
                message: "Não autorizado. Sessão inválida ou expirada."
            }, { status: 401, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const parseResult = alterarSenhaSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: "Senha inválida.",
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const { novaSenha } = parseResult.data;

        // 1. Verificar se era redefinição obrigatória (primeiro acesso)
        const perfilData = await prisma.usuario.findUnique({
            where: { id: sessao.uid }
        });
        const eraPrimeiroAcesso = perfilData?.mustResetPassword === true;

        // 2. Atualizar a senha e zerar a flag de obrigatoriedade
        const senhaHash = await hashSenha(novaSenha);
        await prisma.usuario.update({
            where: { id: sessao.uid },
            data: {
                senhaHash,
                mustResetPassword: false
            }
        });

        // 3. Auditoria
        await registrarAuditoria({
            acao: "usuario.senha.alterada",
            entidade: "usuario",
            entidadeId: sessao.uid,
            usuarioId: sessao.uid,
            empresaId: sessao.empresaId,
            detalhe: { 
                mensagem: `O usuário redefiniu sua senha${eraPrimeiroAcesso ? " provisória durante o primeiro acesso" : ""}.` 
            }
        }).catch(() => null);

        // Opcional: poderíamos disparar email de boas vindas aqui como no original,
        // mas vamos omitir por simplicidade ou manter em background se o serviço existir.

        return NextResponse.json({
            ok: true,
            message: "Senha atualizada com sucesso."
        }, { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error("[ALTERAR_SENHA_ROUTE] Erro interno:", error);

        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Falha na solicitação. Tente novamente."
        }, { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
