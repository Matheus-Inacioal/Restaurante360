import { NextResponse } from 'next/server';
import { z } from 'zod';
import { criarEmpresaComTrial } from '@/server/financeiro/servicos/criar-empresa-com-trial';

const tenantSchema = z.object({
    empresa: z.object({
        nome: z.string().min(2, "Nome muito curto"),
        cnpj: z.string().min(14).max(18),
    }),
    responsavel: z.object({
        nome: z.string().min(2),
        email: z.string().email(),
        whatsappResponsavel: z.string().min(10),
    }),
    planoId: z.string(),
    ciclo: z.enum(['MENSAL', 'ANUAL']),
    diasTrial: z.number().min(0).default(7),
    vencimentoPrimeiraCobrancaEm: z.string().min(10)
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parseResult = tenantSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({ erro: 'Dados inválidos', detalhes: parseResult.error.format() }, { status: 400 });
        }

        const res = await criarEmpresaComTrial(parseResult.data);
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
            sucesso: true,
            empresaId: res.empresaId,
            aceiteToken: res.aceiteToken,
            linkAceite: `${baseUrl}/aceite/${res.aceiteToken}`
        }, { status: 201 });

    } catch (error: any) {
        console.error("Erro na criacao de empresa:", error);
        return NextResponse.json({ erro: 'Falha interna', detalhe: error.message }, { status: 500 });
    }
}
