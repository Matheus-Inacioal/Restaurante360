import { NextResponse } from 'next/server';
import { z } from 'zod';
import { criarEmpresaComTrial } from '@/server/financeiro/servicos/criar-empresa-com-trial';
import { normalizarCNPJ, normalizarWhatsApp } from '@/lib/formatadores/formato';

const tenantSchema = z.object({
    nome: z.string().trim().min(2, "Nome é obrigatório").max(120),
    cnpj: z.string().min(14, "CNPJ precisa ter no mínimo 14 números"),
    responsavelNome: z.string().trim().min(2, "Nome do responsável é obrigatório").max(80),
    email: z.string().trim().toLowerCase().email("Email inválido"),
    whatsappResponsavel: z.string().min(10, "WhatsApp precisa ter no mínimo 10 números"),
    planoId: z.string().min(1, "ID do plano é obrigatório"),
    status: z.enum(["TRIAL_ATIVO", "ATIVA", "SUSPENSA"]).optional(),
    diasTrial: z.number().int().min(0, "Dias trial devem ser maiores ou iguais a 0").default(7),
    vencimentoPrimeiraCobrancaEm: z.string().optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 1. Validar e Sanitizar input básico
        const parseResult = tenantSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                code: "VALIDATION_ERROR",
                message: 'Dados inválidos ou incompletos de criação da empresa.',
                issues: parseResult.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const data = parseResult.data;

        // Limpeza server-side contra invasões com normalizadores
        const cnpjLimpo = normalizarCNPJ(data.cnpj);
        const wappLimpo = normalizarWhatsApp(data.whatsappResponsavel);
        const emailLimpo = data.email.trim().toLowerCase();

        console.log("[CRIAR_EMPRESA] payload recebido:", {
            nome: data.nome, cnpjLimpo, responsavelNome: data.responsavelNome, emailLimpo, wappLimpo
        });

        // Setup dinâmico da fatura
        let vPrimeiraCobranca = data.vencimentoPrimeiraCobrancaEm;
        if (vPrimeiraCobranca) {
            if (vPrimeiraCobranca.length === 10) {
                vPrimeiraCobranca = new Date(vPrimeiraCobranca + "T12:00:00.000Z").toISOString();
            }
        } else if (data.diasTrial > 0) {
            const d = new Date();
            d.setDate(d.getDate() + data.diasTrial);
            vPrimeiraCobranca = d.toISOString();
        }

        const res = await criarEmpresaComTrial({
            empresa: { nome: data.nome, cnpj: cnpjLimpo },
            responsavel: { nome: data.responsavelNome, email: emailLimpo, whatsappResponsavel: wappLimpo },
            planoId: data.planoId,
            ciclo: 'MENSAL',
            diasTrial: data.diasTrial,
            vencimentoPrimeiraCobrancaEm: vPrimeiraCobranca || ''
        });

        const origin = req.headers.get("origin") ?? new URL(req.url).origin;

        // Disparo otimista para mensagens (apenas log sem trava async do fluxo)
        fetch(`${origin}/api/mensagens/email/aceite`, {
            method: 'POST',
            body: JSON.stringify({ email: res.novaEmpresa?.responsavelEmail, tokenAceite: res.aceiteToken, empresaId: res.empresaId }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error("[CRIAR_EMPRESA] Erro disparando email fallback", e));

        fetch(`${origin}/api/mensagens/whatsapp/aceite`, {
            method: 'POST',
            body: JSON.stringify({ telefone: res.novaEmpresa?.whatsappResponsavel, tokenAceite: res.aceiteToken, empresaId: res.empresaId }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error("[CRIAR_EMPRESA] Erro disparando wapp fallback", e));

        const aceiteUrl = `${origin}/aceite/${res.aceiteToken}`;

        return NextResponse.json({
            ok: true,
            empresaId: res.empresaId,
            aceiteToken: res.aceiteToken,
            aceiteUrl: aceiteUrl,
            statusEmpresa: res.novaEmpresa?.status
        }, { status: 201 });

    } catch (error: any) {
        console.error("[CRIAR_EMPRESA] erro", error);

        const message = error?.message || "Erro interno do servidor.";
        const issues = error?.issues || error?.flatten?.() || undefined;

        if (issues) {
            return NextResponse.json({ ok: false, code: "VALIDATION_ERROR", message, issues }, { status: 400 });
        }

        // Erro geral do catch
        return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", message }, { status: 500 });
    }
}
