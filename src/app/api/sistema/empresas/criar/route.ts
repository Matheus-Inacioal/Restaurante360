import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizarCNPJ, normalizarWhatsApp } from '@/lib/formatadores/formato';
import { criarEmpresaService } from '@/server/services/criar-empresa-service';
import { enviarEmailBoasVindas } from '@/server/mensageria/enviar-email-boas-vindas';

const tenantSchema = z.object({
    nomeEmpresa: z.string().trim().min(2, "Nome da empresa é obrigatório").max(120),
    cnpj: z.string().min(14, "CNPJ precisa ter no mínimo 14 números"),
    nomeResponsavel: z.string().trim().min(2, "Nome do responsável é obrigatório").max(80),
    emailResponsavel: z.string().trim().toLowerCase().email("Email inválido"),
    whatsappResponsavel: z.string().min(10, "WhatsApp precisa ter no mínimo 10 números"),
    planoId: z.string().min(1, "ID do plano é obrigatório"),
    diasTrial: z.number().int().min(0, "Dias trial devem ser maiores ou iguais a 0").default(7),
    vencimentoPrimeiraCobrancaEm: z.string().optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validar payload com Zod
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

        // 2 & 3 & 4. Orquestrar a criação nos repositórios (Empresa, Auth, etc)
        const criacaoResult = await criarEmpresaService({
            nome: data.nomeEmpresa,
            cnpj: cnpjLimpo,
            responsavelNome: data.nomeResponsavel,
            email: data.emailResponsavel,
            whatsappResponsavel: wappLimpo,
            planoId: data.planoId,
            diasTrial: data.diasTrial,
            vencimentoPrimeiraCobrancaEm: data.vencimentoPrimeiraCobrancaEm
        });

        if (!criacaoResult.ok) {
            const statusError = criacaoResult.code === "EMAIL_JA_EXISTE" ? 400 : 500;
            return NextResponse.json({
                ok: false,
                code: criacaoResult.code,
                message: criacaoResult.message
            }, { status: statusError });
        }

        const { empresaId, usuarioId, senhaTemporaria } = criacaoResult;

        // 5. Disparo assíncrono do e-mail de Boas Vindas
        if (empresaId && usuarioId && senhaTemporaria) {
            // Executa "em background" sem prender o await da Response
            enviarEmailBoasVindas({
                nomeEmpresa: data.nomeEmpresa,
                nomeResponsavel: data.nomeResponsavel,
                emailResponsavel: data.emailResponsavel,
                senhaTemporaria: senhaTemporaria
            }).catch((err) => {
                // Previne eventuais perdas de scope (embora já seja tratado por dentro da func)
                console.error("[BACKGROUND_EMAIL_TASK] Erro inexperado:", err);
            });
        }

        // 6. Resposta enxuta (Segurança: Não enviar a senhaTemporaria no JSON)
        return NextResponse.json({
            ok: true,
            empresaId: empresaId,
            usuarioId: usuarioId,
            statusEmpresa: "TRIAL_ATIVO"
        }, { status: 201 });

    } catch (error: any) {
        console.error("[CRIAR_EMPRESA_ROUTE] Erro fatal:", error);

        return NextResponse.json({
            ok: false,
            code: "INTERNAL_ERROR",
            message: "Erro interno do servidor ao provisionar empresa."
        }, { status: 500 });
    }
}
