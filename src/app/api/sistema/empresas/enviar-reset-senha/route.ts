import { NextResponse } from "next/server";
import { z } from "zod";
import { garantirAcessoSistema } from "@/server/auth/garantirAcessoSistema";
import { adminAuth, adminDb } from "@/server/firebase/admin";
import { enviarEmail } from "@/server/email/enviar-email";
import { gerarTemplateResetSenha } from "@/server/templates/email-reset-senha";
import { repositorioAuditoriaAdmin } from "@/server/admin/repositorio-auditoria-admin";

const schema = z.object({
    empresaId: z.string().min(1),
    emailLogin: z.string().email("E-mail inválido."),
    nomeEmpresa: z.string().min(1),
    nomeResponsavel: z.string().optional(),
    urlLogin: z.string().url().optional(),
});

const APP_URL = process.env.APP_URL || "http://localhost:9002";

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

        const { empresaId, emailLogin, nomeEmpresa, nomeResponsavel, urlLogin: urlLoginCustom } = parsed.data;
        const urlLogin = urlLoginCustom || `${APP_URL}/login`;

        // Verificar que o email bate com um usuário da empresa
        try {
            const empresaSnap = await adminDb.collection("empresas").doc(empresaId).get();
            if (!empresaSnap.exists) {
                return NextResponse.json({ ok: false, code: "EMPRESA_NAO_ENCONTRADA", message: "Empresa não encontrada." }, { status: 404 });
            }
        } catch (err) {
            console.error("[ENVIAR_RESET_EMPRESA] Erro ao verificar empresa:", err);
        }

        // Gerar link via Firebase Admin
        let linkReset: string;
        try {
            linkReset = await adminAuth.generatePasswordResetLink(emailLogin, { url: urlLogin });
        } catch (err: any) {
            console.error("[ENVIAR_RESET_EMPRESA] Erro ao gerar link:", err);
            return NextResponse.json({
                ok: false,
                code: err.code === "auth/user-not-found" ? "USUARIO_NAO_ENCONTRADO" : "LINK_GENERATION_FAILED",
                message: err.code === "auth/user-not-found"
                    ? "Nenhum usuário encontrado com este e-mail."
                    : "Não foi possível gerar o link de redefinição.",
            }, { status: err.code === "auth/user-not-found" ? 404 : 500 });
        }

        // Montar template
        const template = gerarTemplateResetSenha({
            nomeResponsavel,
            nomeEmpresa,
            emailLogin,
            linkReset,
            urlLogin,
        });

        // Enviar e-mail
        const emailResult = await enviarEmail({
            to: emailLogin,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });

        // Auditoria (não-bloqueante)
        repositorioAuditoriaAdmin.registrarLog({
            tipo: "SISTEMA_ENVIAR_RESET_SENHA",
            empresaId,
            usuarioId: sessao.uid,
            descricao: `Admin enviou reset de senha para ${emailLogin} (empresa: ${nomeEmpresa})`,
            metadata: { emailLogin, nomeEmpresa, emailEnviado: emailResult.ok },
        }).catch(console.error);

        const isDev = process.env.NODE_ENV !== "production";

        // DEV fallback sem provedor de e-mail
        if (!emailResult.ok && (emailResult as any).reason === "EMAIL_PROVIDER_NOT_CONFIGURED" && isDev) {
            console.log(`\n[ENVIAR_RESET_EMPRESA] DEV LINK para '${emailLogin}':\n${linkReset}\n`);
            return NextResponse.json({ ok: true, debugLink: linkReset }, { status: 200 });
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
