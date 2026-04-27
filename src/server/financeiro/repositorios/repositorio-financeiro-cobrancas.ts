import "server-only";
import { prisma } from '@/lib/prisma';
import { Cobranca } from '@/lib/types/financeiro';

export const repositorioFinanceiroCobrancas = {
    async criarOuAtualizarCobrancaPorAsaasPaymentId(asaasPaymentId: string, dados: Partial<Cobranca> & { id?: string }): Promise<string> {
        const existing = await prisma.cobranca.findUnique({
            where: { asaasPaymentId }
        });

        if (existing) {
            await prisma.cobranca.update({
                where: { asaasPaymentId },
                data: {
                    assinaturaId: dados.assinaturaId,
                    asaasSubscriptionId: dados.asaasSubscriptionId,
                    valor: dados.valor,
                    valorLiquido: dados.valorLiquido,
                    vencimento: dados.vencimento ? new Date(dados.vencimento) : undefined,
                    status: dados.status,
                    formaPagamento: dados.formaPagamento,
                    invoiceUrl: dados.invoiceUrl,
                    bankSlipUrl: dados.bankSlipUrl,
                    pixPayload: dados.pixPayload,
                    pagaEm: dados.pagaEm ? new Date(dados.pagaEm) : null,
                }
            });
            return existing.id;
        } else {
            const docId = dados.id || crypto.randomUUID();
            await prisma.cobranca.create({
                data: {
                    id: docId,
                    empresaId: dados.empresaId!,
                    asaasPaymentId,
                    assinaturaId: dados.assinaturaId,
                    asaasSubscriptionId: dados.asaasSubscriptionId,
                    valor: dados.valor || 0,
                    valorLiquido: dados.valorLiquido,
                    vencimento: dados.vencimento ? new Date(dados.vencimento) : new Date(),
                    status: dados.status || "PENDING",
                    formaPagamento: dados.formaPagamento || "UNDEFINED",
                    invoiceUrl: dados.invoiceUrl,
                    bankSlipUrl: dados.bankSlipUrl,
                    pixPayload: dados.pixPayload,
                    pagaEm: dados.pagaEm ? new Date(dados.pagaEm) : null,
                }
            });
            return docId;
        }
    },

    async listarCobrancasPorEmpresa(empresaId: string, limite: number = 10): Promise<Cobranca[]> {
        const cobrancas = await prisma.cobranca.findMany({
            where: { empresaId },
            orderBy: { vencimento: 'desc' },
            take: limite
        });

        return cobrancas.map(c => ({
            ...c,
            vencimento: c.vencimento.toISOString(),
            pagaEm: c.pagaEm?.toISOString(),
            criadoEm: c.criadaEm.toISOString(),
            atualizadoEm: c.atualizadaEm.toISOString(),
        } as unknown as Cobranca));
    }
}
