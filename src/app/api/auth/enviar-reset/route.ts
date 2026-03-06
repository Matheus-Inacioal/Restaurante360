import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/server/firebase/admin";
import { enviarEmail } from "@/server/email/enviar-email";
import { gerarTemplateResetSenha } from "@/server/templates/email-reset-senha";
import { repositorioAuditoriaAdmin } from "@/server/admin/repositorio-auditoria-admin";

const schema = z.object({
    email: z.string().email("E-mail inválido."),
});

const APP_URL = process.env.APP_URL || "http://localhost:9002";

// Endpoint público — usado pelo /login "Esqueceu sua senha?"
// Não retorna erro specifically para email inexistente (segurança — não revela existência de conta)
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
        const urlLogin = `${APP_URL}/login`;

        let linkReset: string | null = null;
        let geracaoFalhou = false;

        // Tenta gerar o link de reset via Firebase Admin
        try {
            linkReset = await adminAuth.generatePasswordResetLink(email, {
                url: urlLogin,
            });
        } catch (err: any) {
            // auth/user-not-found → não revelar a existência da conta
            if (err.code === "auth/user-not-found") {
                // Logar internamente mas fingir sucesso para o cliente
                console.info(`[ENVIAR_RESET] E-mail não encontrado no Auth: ${email}`);
                return NextResponse.json({ ok: true }, { status: 200 });
            }
            console.error("[ENVIAR_RESET] Erro ao gerar link de reset:", err);
            geracaoFalhou = true;
        }

        const isDev = process.env.NODE_ENV !== "production";

        if (!linkReset || geracaoFalhou) {
            if (isDev) {
                console.warn("[ENVIAR_RESET] DEV: Falha ao gerar link. Retornando ok:true sem link.");
                return NextResponse.json({ ok: true }, { status: 200 });
            }
            return NextResponse.json({ ok: false, code: "LINK_GENERATION_FAILED", message: "Não foi possível gerar o link de redefinição." }, { status: 500 });
        }

        // Montar template (sem nomeEmpresa e nomeResponsavel para reset público)
        const template = gerarTemplateResetSenha({
            emailLogin: email,
            linkReset,
            urlLogin,
        });

        // Tentar enviar e-mail
        const emailResult = await enviarEmail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        // Registrar auditoria (não-bloqueante)
        repositorioAuditoriaAdmin.registrarLog({
            tipo: "PUBLICO_ENVIAR_RESET",
            descricao: `Reset de senha solicitado para ${email}`,
            metadata: { email, emailEnviado: emailResult.ok },
        }).catch(console.error);

        // Fallback DEV: sem provedor configurado — retornar debugLink
        if (!emailResult.ok && (emailResult as any).reason === "EMAIL_PROVIDER_NOT_CONFIGURED" && isDev) {
            console.log(`[ENVIAR_RESET] DEV LINK: ${linkReset}`);
            return NextResponse.json({
                ok: true,
                debugLink: linkReset,
            }, { status: 200 });
        }

        // Sucesso (ou PROD sem provedor — fingimos sucesso por segurança)
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
