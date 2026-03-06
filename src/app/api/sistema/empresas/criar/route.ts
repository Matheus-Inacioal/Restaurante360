import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizarCNPJ, normalizarWhatsApp } from '@/lib/formatadores/formato';
import { criarEmpresaService } from '@/server/services/criar-empresa-service';
import { enviarEmail } from '@/server/email/enviar-email';
import { gerarTemplatePrimeiroAcesso } from '@/server/templates/email-primeiro-acesso';
import { repositorioAuditoriaAdmin } from '@/server/admin/repositorio-auditoria-admin';

const tenantSchema = z.object({
    nomeEmpresa: z.string().trim().min(2, "Nome da empresa é obrigatório").max(120),
    cnpj: z.string().min(14, "CNPJ precisa ter no mínimo 14 números"),
    nomeResponsavel: z.string().trim().min(2, "Nome do responsável é obrigatório").max(80),
    emailResponsavel: z.string().trim().toLowerCase().email("Email inválido"),
    whatsappResponsavel: z.string().min(10, "WhatsApp precisa ter no mínimo 10 números"),
    planoId: z.string().min(1, "ID do plano é obrigatório"),
    diasTrial: z.number().int().min(0, "Dias trial devem ser maiores ou iguais a 0").default(7),
    vencimentoPrimeiraCobrancaEm: z.string().optional(),
});

const APP_URL = process.env.APP_URL || "http://localhost:9002";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const parseResult = tenantSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: 'Dados inválidos ou incompletos.',
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const data = parseResult.data;
        const cnpjLimpo = normalizarCNPJ(data.cnpj);
        const wappLimpo = normalizarWhatsApp(data.whatsappResponsavel);

        const criacaoResult = await criarEmpresaService({
            nomeEmpresa: data.nomeEmpresa,
            cnpj: cnpjLimpo,
            nomeResponsavel: data.nomeResponsavel,
            emailResponsavel: data.emailResponsavel,
            whatsappResponsavel: wappLimpo,
            planoId: data.planoId,
            diasTrial: data.diasTrial,
            vencimentoPrimeiraCobrancaEm: data.vencimentoPrimeiraCobrancaEm,
        });

        // Validando se o serviço falhou durante o processo
        if (!criacaoResult.ok) {
            console.error(`[CRIAR_EMPRESA_ERRO] Code: ${criacaoResult.code} | Message: ${criacaoResult.message}`, criacaoResult.originalError || 'Sem stack trace original');

            const isDev = process.env.NODE_ENV === "development";
            const statusError = criacaoResult.code === "EMAIL_JA_EXISTE" ? 400 : 500;

            return NextResponse.json({
                ok: false,
                code: criacaoResult.code,
                message: criacaoResult.message,
                details: isDev && criacaoResult.originalError ? {
                    name: criacaoResult.originalError.name,
                    message: criacaoResult.originalError.message,
                    stack: criacaoResult.originalError.stack,
                    code: criacaoResult.originalError.code
                } : undefined
            }, {
                status: statusError,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { empresaId, usuarioId, linkPrimeiroAcesso, statusEmpresa, emailResponsavel } = criacaoResult;

        const isDev = process.env.NODE_ENV !== "production";
        let debugInviteLink: string | undefined;

        // Disparar e-mail de primeiro acesso em background
        if (linkPrimeiroAcesso && empresaId && usuarioId) {
            const urlLogin = `${APP_URL}/login`;
            const template = gerarTemplatePrimeiroAcesso({
                nomeResponsavel: data.nomeResponsavel,
                nomeEmpresa: data.nomeEmpresa,
                emailLogin: data.emailResponsavel,
                linkReset: linkPrimeiroAcesso,
                urlLogin,
            });

            // Executar em background (não bloquear a resposta)
            Promise.resolve().then(async () => {
                const emailResult = await enviarEmail({
                    to: data.emailResponsavel,
                    subject: template.subject,
                    html: template.html,
                    text: template.text,
                });

                if (!emailResult.ok) {
                    console.warn(`[CRIAR_EMPRESA_ROUTE] E-mail de convite não enviado para ${data.emailResponsavel}. Motivo: ${(emailResult as any).error}`);
                    if (isDev) {
                        console.log(`\n📨 [DEV] LINK DE CONVITE (primeiro acesso):\n${linkPrimeiroAcesso}\n`);
                    }
                }

                // Auditoria
                repositorioAuditoriaAdmin.registrarLog({
                    tipo: "SISTEMA_ENVIAR_CONVITE_PRIMEIRO_ACESSO",
                    empresaId,
                    descricao: `Convite de primeiro acesso enviado para ${data.emailResponsavel} (empresa: ${data.nomeEmpresa})`,
                    metadata: { emailEnviado: emailResult.ok, nomeEmpresa: data.nomeEmpresa },
                }).catch(console.error);
            }).catch(e => console.error("[CRIAR_EMPRESA_ROUTE] Erro assíncrono durante e-mail:", e));

            // Em DEV, incluir o link no JSON de resposta para facilitar teste
            if (isDev) {
                debugInviteLink = linkPrimeiroAcesso;
            }
        }

        // Auditoria de criação da empresa
        repositorioAuditoriaAdmin.registrarLog({
            tipo: "EMPRESA_CRIADA",
            empresaId: empresaId || "unknown",
            descricao: `Empresa ${data.nomeEmpresa} criada. Responsável: ${data.emailResponsavel}`,
            metadata: { cnpj: cnpjLimpo, planoId: data.planoId, diasTrial: data.diasTrial },
        }).catch(console.error);

        return NextResponse.json({
            ok: true,
            empresaId,
            usuarioId,
            statusEmpresa,
            emailResponsavel,
            ...(debugInviteLink && { linkPrimeiroAcesso: debugInviteLink }),
        }, {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("[CRIAR_EMPRESA_ROUTE_FATAL] Erro não capturado na rota:", error);

        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Erro interno do servidor ao provisionar empresa.",
            details: process.env.NODE_ENV === "development" ? {
                name: error?.name,
                message: error?.message,
                stack: error?.stack
            } : undefined
        }, {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
