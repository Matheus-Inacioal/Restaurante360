import { NextResponse } from 'next/server';
import { z } from 'zod';
import { criarEmpresaComTrial } from '@/server/financeiro/servicos/criar-empresa-com-trial';

const tenantSchema = z.object({
    nome: z.string().min(2, "Nome é obrigatório"),
    cnpj: z.string().regex(/^\d{14}$/, "CNPJ inválido (precisa ter 14 dígitos)"),
    responsavel: z.string().min(2, "Nome do responsável é obrigatório"),
    email: z.string().email("Email inválido"),
    whatsappResponsavel: z.string().regex(/^\d{12,13}$/, "WhatsApp inválido (inclua DDD)"),
    planoId: z.string(),
    status: z.string().optional(),
    diasTrial: z.number().min(0, "Dias trial devem ser maiores ou iguais a 0").default(7),
    vencimentoPrimeiraCobrancaEm: z.string().min(10, "Data de vencimento inválida")
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parseResult = tenantSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({
                ok: false,
                message: 'Dados inválidos',
                issues: parseResult.error.flatten()
            }, { status: 400 });
        }

        const res = await criarEmpresaComTrial({
            empresa: { nome: parseResult.data.nome, cnpj: parseResult.data.cnpj },
            responsavel: { nome: parseResult.data.responsavel, email: parseResult.data.email, whatsappResponsavel: parseResult.data.whatsappResponsavel },
            planoId: parseResult.data.planoId,
            ciclo: 'MENSAL',
            diasTrial: parseResult.data.diasTrial,
            vencimentoPrimeiraCobrancaEm: parseResult.data.vencimentoPrimeiraCobrancaEm
        });
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Disparo para Endpoints Fake de Mensageria
        fetch(`${baseUrl}/api/mensagens/email/aceite`, {
            method: 'POST',
            body: JSON.stringify({ email: res.novaEmpresa.responsavelEmail, tokenAceite: res.aceiteToken, empresaId: res.empresaId }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error("Erro disparando email fallback", e));

        fetch(`${baseUrl}/api/mensagens/whatsapp/aceite`, {
            method: 'POST',
            body: JSON.stringify({ telefone: res.novaEmpresa.whatsappResponsavel, tokenAceite: res.aceiteToken, empresaId: res.empresaId }),
            headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error("Erro disparando wapp fallback", e));

        return NextResponse.json({
            ok: true,
            sucesso: true,
            empresaId: res.empresaId,
            aceiteToken: res.aceiteToken,
            linkAceite: `${baseUrl}/aceite/${res.aceiteToken}`
        }, { status: 200 });

    } catch (error: any) {
        console.error("Erro na criacao de empresa:", error);

        const message = error?.message || "Erro interno";
        const issues = error?.issues || error?.flatten?.() || undefined;

        // Erro geral do catch
        return NextResponse.json({ ok: false, message, issues }, { status: 500 });
    }
}
