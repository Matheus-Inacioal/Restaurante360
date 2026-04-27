import "server-only";
import { prisma } from '@/lib/prisma';
import { Assinatura } from '@/lib/types/financeiro';

export const repositorioFinanceiroAssinaturas = {
    async criarOuAtualizarAssinatura(empresaId: string, dados: Partial<Assinatura> & { id?: string }): Promise<string> {
        let docId = dados.id || empresaId;
        
        const existing = await prisma.assinatura.findUnique({ where: { id: docId } });

        if (existing) {
            await prisma.assinatura.update({
                where: { id: docId },
                data: {
                    planoId: dados.planoId,
                    asaasSubscriptionId: dados.asaasSubscriptionId,
                    status: dados.status,
                    valor: dados.valor,
                    ciclo: dados.ciclo,
                    formaPagamento: dados.formaPagamento,
                    proximoVencimento: dados.proximoVencimento ? new Date(dados.proximoVencimento) : null,
                    inicioAssinatura: dados.inicioAssinatura ? new Date(dados.inicioAssinatura) : undefined
                }
            });
        } else {
            await prisma.assinatura.create({
                data: {
                    id: docId,
                    empresaId,
                    planoId: dados.planoId!,
                    asaasSubscriptionId: dados.asaasSubscriptionId,
                    status: dados.status || "ACTIVE",
                    valor: dados.valor!,
                    ciclo: dados.ciclo || "MENSAL",
                    formaPagamento: dados.formaPagamento || "UNDEFINED",
                    proximoVencimento: dados.proximoVencimento ? new Date(dados.proximoVencimento) : null,
                    inicioAssinatura: dados.inicioAssinatura ? new Date(dados.inicioAssinatura) : new Date()
                }
            });
        }

        return docId;
    },

    async obterAssinaturaPorEmpresa(empresaId: string): Promise<Assinatura | null> {
        const doc = await prisma.assinatura.findFirst({
            where: { empresaId }
        });

        if (!doc) return null;

        return {
            ...doc,
            proximoVencimento: doc.proximoVencimento?.toISOString(),
            inicioAssinatura: doc.inicioAssinatura.toISOString(),
            criadaEm: doc.criadaEm.toISOString(),
            atualizadaEm: doc.atualizadaEm.toISOString()
        } as Assinatura;
    }
}
