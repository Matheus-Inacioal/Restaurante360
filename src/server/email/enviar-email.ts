import "server-only";

export interface EnviarEmailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export type ResultadoEnvioEmail =
    | { ok: true }
    | { ok: false; error: string; reason?: string };

/**
 * Provedor universal de e-mail com detecção automática de configuração.
 * Prioridade: Resend → SMTP (Nodemailer) → Fallback DEV (log sem envio).
 */
export async function enviarEmail(params: EnviarEmailParams): Promise<ResultadoEnvioEmail> {
    const { to, subject, html, text } = params;
    const from = process.env.EMAIL_FROM || "Restaurante360 <noreply@restaurante360.com.br>";

    // ──────────────────────────────────────────────────────────────────
    // Opção 1: Resend
    // ──────────────────────────────────────────────────────────────────
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
        try {
            // Importação dinâmica para não quebrar o build se o pacote não estiver instalado
            const { Resend } = await import("resend").catch(() => ({ Resend: null }));
            if (!Resend) {
                console.warn("[ENVIAR_EMAIL] Pacote 'resend' não instalado. Pulando para SMTP.");
            } else {
                const resend = new Resend(resendApiKey);
                const result = await resend.emails.send({ from, to, subject, html, text });
                if (result.error) {
                    console.error("[ENVIAR_EMAIL] Resend error:", result.error);
                    return { ok: false, error: result.error.message || "Falha ao enviar via Resend." };
                }
                return { ok: true };
            }
        } catch (err: any) {
            console.error("[ENVIAR_EMAIL] Falha inesperada no Resend:", err);
            return { ok: false, error: err?.message || "Erro desconhecido no Resend." };
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Opção 2: SMTP via Nodemailer
    // ──────────────────────────────────────────────────────────────────
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
        try {
            const nodemailer = await import("nodemailer").catch(() => null);
            if (!nodemailer) {
                console.warn("[ENVIAR_EMAIL] Pacote 'nodemailer' não instalado. Pulando para fallback.");
            } else {
                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: parseInt(process.env.SMTP_PORT || "587"),
                    secure: process.env.SMTP_PORT === "465",
                    auth: { user: smtpUser, pass: smtpPass },
                });
                await transporter.sendMail({ from, to, subject, html, text });
                return { ok: true };
            }
        } catch (err: any) {
            console.error("[ENVIAR_EMAIL] Falha no SMTP:", err);
            return { ok: false, error: err?.message || "Erro no envio via SMTP." };
        }
    }

    // ──────────────────────────────────────────────────────────────────
    // Fallback: Nenhum provedor configurado
    // ──────────────────────────────────────────────────────────────────
    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
        // Em desenvolvimento: log completo, sem bloquear o fluxo
        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("[ENVIAR_EMAIL - DEV FALLBACK] Nenhum provedor configurado.");
        console.log(`📧 Para: ${to}`);
        console.log(`📋 Assunto: ${subject}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        return { ok: false, error: "EMAIL_PROVIDER_NOT_CONFIGURED", reason: "EMAIL_PROVIDER_NOT_CONFIGURED" };
    }

    // Em produção: falha explícita
    console.error("[ENVIAR_EMAIL] PROD: Nenhum provedor de e-mail configurado. Configure RESEND_API_KEY ou SMTP_*.");
    return { ok: false, error: "EMAIL_NOT_CONFIGURED" };
}
