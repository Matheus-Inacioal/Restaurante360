import { NextResponse } from 'next/server';
import { processarWebhookAsaas } from '@/server/financeiro/servicos/processar-webhook-asaas';

// Token mock simples de seguranca local. Num envio real O asaas manda header "asaas-access-token"
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || 'segredowebhook';

export async function POST(request: Request) {
    try {
        const token = request.headers.get('asaas-access-token');

        if (process.env.NODE_ENV === 'production' && token !== WEBHOOK_TOKEN) {
            return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
        }

        const payload = await request.json();
        const res = await processarWebhookAsaas(payload);

        return NextResponse.json(res);

    } catch (error: any) {
        console.error("Erro no Webhook:", error);
        return NextResponse.json({ erro: 'Falha interna webhook', detalhe: error.message }, { status: 500 });
    }
}
