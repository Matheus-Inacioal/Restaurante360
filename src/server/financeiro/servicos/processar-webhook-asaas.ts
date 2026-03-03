import "server-only";

import { repositorioFinanceiroWebhookEventos } from '../repositorios/repositorio-financeiro-webhook-eventos';
import { repositorioFinanceiroCobrancas } from '../repositorios/repositorio-financeiro-cobrancas';
import { repositorioFinanceiroAuditoria } from '../repositorios/repositorio-financeiro-auditoria';

export async function processarWebhookAsaas(payload: any) {
    const asaasEventId = payload.id;
    const evento = payload.event;
    const payment = payload.payment;

    if (!asaasEventId || !evento || !payment) {
        throw new Error('Payload inválido detectado na porta do serviço.');
    }

    const jaProcessado = await repositorioFinanceiroWebhookEventos.verificarIdempotencia(asaasEventId);
    if (jaProcessado) {
        return { idempotencia: true, mensagem: 'Evento processado anteriormente.' };
    }

    const asaasPaymentId = payment.id;

    const cobracaRefId = await repositorioFinanceiroCobrancas.criarOuAtualizarCobrancaPorAsaasPaymentId(asaasPaymentId, {
        status: payment.status,
        valor: payment.value,
        vencimento: payment.dueDate,
        formaPagamento: payment.billingType,
        bankSlipUrl: payment.bankSlipUrl,
        invoiceUrl: payment.invoiceUrl,
        pixPayload: payment.pixCopiaECola,
    });

    if (evento === 'PAYMENT_RECEIVED' || evento === 'PAYMENT_CONFIRMED') {
        await repositorioFinanceiroAuditoria.registrarEvento({
            tipo: 'PAGAMENTO_CONFIRMADO',
            descricao: `[FATURA PAGA] Fatura Liquidada via Webhook (Asaas ID: ${asaasPaymentId}, Valor: ${payment.value})`
        });
    }

    if (evento === 'PAYMENT_OVERDUE') {
        await repositorioFinanceiroAuditoria.registrarEvento({
            tipo: 'COBRANCA_VENCIDA',
            descricao: `[FATURA VENCIDA] A Fatura do ASAAS ${asaasPaymentId} entrou em atraso (Vencida em: ${payment.dueDate}).`
        });
    }

    await repositorioFinanceiroWebhookEventos.registrarProcessamento(asaasEventId, evento, payload);

    return {
        sucesso: true,
        eventoLogado: asaasEventId,
        cobrancaReferencia: cobracaRefId
    };
}
