import { NextResponse } from 'next/server';
import { confirmarAceiteECriarAssinatura } from '@/server/financeiro/servicos/confirmar-aceite-e-criar-assinatura';
import { FormaPagamento } from '@/lib/types/financeiro';

export interface RequestAssinaturaBody {
    tokenAceite: string;
    formaPagamento: FormaPagamento;
}

export async function POST(request: Request) {
    try {
        const body: RequestAssinaturaBody = await request.json();

        const res = await confirmarAceiteECriarAssinatura(body);

        return NextResponse.json(res);

    } catch (error: any) {
        console.error("Erro na criação de assinatura:", error);
        return NextResponse.json({
            erro: error.message || 'Falha interna na geração da assinatura',
            detalhe: error.message
        }, { status: error.message?.includes('inválido') ? 404 : 400 });
    }
}
