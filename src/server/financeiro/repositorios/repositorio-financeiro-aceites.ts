import "server-only";
import { prisma } from '@/lib/prisma';
import { AceiteAssinatura } from '@/lib/types/financeiro';

export const repositorioFinanceiroAceites = {
    async criarAceite(dados: Omit<AceiteAssinatura, 'id'> & { id?: string }): Promise<string> {
        const result = await prisma.aceiteAssinatura.create({
            data: {
                ...(dados.id ? { id: dados.id } : {}),
                empresaId: dados.empresaId,
                planoId: dados.planoId,
                ciclo: dados.ciclo,
                valor: dados.valor,
                status: dados.status || "PENDENTE",
                expiraEm: new Date(dados.expiraEm),
                diasTrial: dados.diasTrial,
                responsavelNome: dados.responsavelNome,
                responsavelEmail: dados.responsavelEmail,
                whatsappResponsavel: dados.whatsappResponsavel,
                cnpj: dados.cnpj,
                vencimentoPrimeiraCobrancaEm: dados.vencimentoPrimeiraCobrancaEm ? new Date(dados.vencimentoPrimeiraCobrancaEm) : null,
                aceitoEm: dados.aceitoEm ? new Date(dados.aceitoEm) : null,
                aceitoPorCanal: dados.aceitoPorCanal,
                formaPagamentoEscolhida: dados.formaPagamentoEscolhida,
                asaasCustomerId: dados.asaasCustomerId,
                asaasSubscriptionId: dados.asaasSubscriptionId,
            }
        });
        return result.id;
    },

    async obterAceitePorToken(token: string): Promise<AceiteAssinatura | null> {
        const doc = await prisma.aceiteAssinatura.findUnique({
            where: { id: token }
        });
        if (!doc) return null;
        return {
            ...doc,
            expiraEm: doc.expiraEm.toISOString(),
            vencimentoPrimeiraCobrancaEm: doc.vencimentoPrimeiraCobrancaEm?.toISOString(),
            aceitoEm: doc.aceitoEm?.toISOString(),
            criadoEm: doc.criadoEm.toISOString()
        } as AceiteAssinatura;
    },

    async marcarAceiteComoAceito(aceiteId: string, dados: Partial<AceiteAssinatura>): Promise<void> {
        await prisma.aceiteAssinatura.update({
            where: { id: aceiteId },
            data: {
                ...dados,
                status: 'ACEITO',
                aceitoEm: new Date()
            }
        });
    }
}
