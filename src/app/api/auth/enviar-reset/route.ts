import { NextResponse } from "next/server";
import { z } from "zod";
import { servicoEmail } from "@/server/servicos/servico-email";
import { servicoLinksAutenticacao } from "@/server/servicos/servico-links-autenticacao";
import { registrarAuditoria } from "@/server/servicos/servico-auditoria";

const schema = z.object({
    email: z.string().email("E-mail inválido."),
});

/**
 * POST /api/auth/enviar-reset
 *
 * Endpoint público — usado pelo /login "Esqueceu sua senha?"
 * Não retorna erro específico para email inexistente (segurança — não revela existência de conta).
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: "E-mail inválido.",
                issues: parsed.error.flatten().fieldErrors,
            }, { status: 400 });
        }

        const { email } = parsed.data;

        // Gerar link via serviço centralizado (PostgreSQL)
        const resultado = await servicoLinksAutenticacao.gerarLinkRedefinicaoSenha(email);

        // Se user-not-found → fingir sucesso (segurança)
        if (!resultado.ok && resultado.erro?.includes("Nenhum usuário")) {
            console.info(`[ENVIAR_RESET] E-mail não encontrado no banco: ${email}`);
            return NextResponse.json({ ok: true }, { status: 200 });
        }

        if (!resultado.ok || !resultado.link) {
            const isDev = process.env.NODE_ENV !== "production";
            if (isDev) {
                console.warn("[ENVIAR_RESET] DEV: Falha ao gerar link. Retornando ok:true.");
                return NextResponse.json({ ok: true }, { status: 200 });
            }
            return NextResponse.json({ ok: false, code: "LINK_GENERATION_FAILED", message: "Não foi possível gerar o link de redefinição." }, { status: 500 });
        }

        // Enviar e-mail via serviço centralizado
        const emailResult = await servicoEmail.enviarEmailResetSenha({
            emailDestinatario: email,
            linkReset: resultado.link,
        });

        // Registrar auditoria (não-bloqueante)
        registrarAuditoria({
            usuarioId: "PUBLICO",
            acao: "auth.reset.solicitado",
            entidade: "usuario",
            entidadeId: email,
            detalhe: { emailEnviado: emailResult.ok },
        }).catch(() => null);

        // Fallback DEV: sem provedor → retornar debugLink
        const isDev = process.env.NODE_ENV !== "production";
        if (!emailResult.ok && (emailResult as any).reason === "EMAIL_PROVIDER_NOT_CONFIGURED" && isDev) {
            console.log(`[ENVIAR_RESET] DEV LINK: ${resultado.link}`);
            return NextResponse.json({ ok: true, debugLink: resultado.link }, { status: 200 });
        }

        return NextResponse.json({ ok: true }, { status: 200 });

    } catch (error: any) {
        console.error("[ENVIAR_RESET] Erro fatal:", error);
        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Erro interno ao processar a solicitação.",
        }, { status: 500 });
    }
}
