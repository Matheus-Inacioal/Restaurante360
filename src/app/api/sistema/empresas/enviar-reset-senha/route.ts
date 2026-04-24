import { NextResponse } from "next/server";
import { z } from "zod";
import { garantirAcessoSistema } from "@/server/auth/garantirAcessoSistema";
import { servicoEmail } from "@/server/servicos/servico-email";
import { servicoLinksAutenticacao } from "@/server/servicos/servico-links-autenticacao";
import { registrarAuditoria } from "@/server/servicos/servico-auditoria";
import { prisma } from "@/lib/prisma";

const schema = z.object({
    empresaId: z.string().min(1),
    emailLogin: z.string().email("E-mail inválido."),
    nomeEmpresa: z.string().min(1),
    nomeResponsavel: z.string().optional(),
    urlLogin: z.string().url().optional(),
});

export async function POST(req: Request) {
    try {
        // Verificar acesso de sistema (admin SaaS)
        const authResult = await garantirAcessoSistema(req);
        if (authResult instanceof Response) {
            return authResult;
        }
        const { sessao } = authResult;

        const body = await req.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: "Dados inválidos.",
                issues: parsed.error.flatten().fieldErrors,
            }, { status: 400 });
        }

        const { empresaId, emailLogin, nomeEmpresa, nomeResponsavel } = parsed.data;

        // Verificar que a empresa existe
        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });

        if (!empresa) {
            return NextResponse.json({ ok: false, code: "EMPRESA_NAO_ENCONTRADA", message: "Empresa não encontrada." }, { status: 404 });
        }

        // Gerar link via servico centralizado (PostgreSQL)
        const resultado = await servicoLinksAutenticacao.gerarLinkRedefinicaoSenha(emailLogin);

        if (!resultado.ok || !resultado.link) {
            return NextResponse.json({
                ok: false,
                code: resultado.erro?.includes("Nenhum usuário") ? "USUARIO_NAO_ENCONTRADO" : "LINK_GENERATION_FAILED",
                message: resultado.erro || "Não foi possível gerar o link de redefinição.",
            }, { status: resultado.erro?.includes("Nenhum usuário") ? 404 : 500 });
        }

        // Enviar e-mail via serviço centralizado
        const emailResult = await servicoEmail.enviarEmailResetSenha({
            emailDestinatario: emailLogin,
            linkReset: resultado.link,
            nomeUsuario: nomeResponsavel,
            nomeEmpresa,
        });

        // Auditoria (não-bloqueante)
        registrarAuditoria({
            usuarioId: sessao.uid,
            acao: "admin.enviou.reset",
            entidade: "empresa",
            entidadeId: empresaId,
            empresaId,
            detalhe: { emailLogin, emailEnviado: emailResult.ok },
        }).catch(() => null);

        const isDev = process.env.NODE_ENV !== "production";

        // DEV fallback sem provedor de e-mail
        if (!emailResult.ok && (emailResult as any).reason === "EMAIL_PROVIDER_NOT_CONFIGURED" && isDev) {
            console.log(`\n[ENVIAR_RESET_EMPRESA] DEV LINK para '${emailLogin}':\n${resultado.link}\n`);
            return NextResponse.json({ ok: true, debugLink: resultado.link }, { status: 200 });
        }

        if (!emailResult.ok) {
            return NextResponse.json({
                ok: false,
                code: "EMAIL_SEND_FAILED",
                message: "O link foi gerado mas o e-mail não pôde ser enviado.",
            }, { status: 500 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });

    } catch (error: any) {
        console.error("[ENVIAR_RESET_EMPRESA] Erro fatal:", error);
        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Erro interno ao processar a solicitação.",
        }, { status: 500 });
    }
}
