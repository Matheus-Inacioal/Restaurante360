import "server-only";
import { prisma } from '@/lib/prisma';
import { EmpresaAtualizada } from '@/lib/types/financeiro';

export const repositorioEmpresasAdmin = {
    async criarEmpresa(dados: Omit<EmpresaAtualizada, 'id'> & { id?: string }): Promise<string> {
        let finalId = dados.id || crypto.randomUUID();

        await prisma.empresa.create({
            data: {
                id: finalId,
                nome: dados.nome,
                cnpj: dados.cnpj || "",
                responsavelNome: dados.responsavelNome || "",
                responsavelEmail: dados.responsavelEmail || "",
                whatsappResponsavel: dados.whatsappResponsavel,
                status: dados.status as any || "TRIAL_ATIVO",
                planoId: dados.planoId,
                planoNome: dados.planoNome,
                diasTrial: dados.diasTrial || 14,
                trialInicio: dados.trialInicio ? new Date(dados.trialInicio) : null,
                trialFim: dados.trialFim ? new Date(dados.trialFim) : null,
                asaasCustomerId: dados.asaasCustomerId
            }
        });
        return finalId;
    },

    async obterEmpresaPorId(empresaId: string): Promise<EmpresaAtualizada | null> {
        const doc = await prisma.empresa.findUnique({
            where: { id: empresaId }
        });
        if (!doc) return null;
        return {
            ...doc,
            trialInicio: doc.trialInicio?.toISOString(),
            trialFim: doc.trialFim?.toISOString(),
            criadoEm: doc.criadoEm.toISOString(),
            atualizadoEm: doc.atualizadoEm.toISOString()
        } as unknown as EmpresaAtualizada;
    },

    async atualizarEmpresa(empresaId: string, dados: Partial<EmpresaAtualizada>): Promise<void> {
        await prisma.empresa.update({
            where: { id: empresaId },
            data: {
                nome: dados.nome,
                cnpj: dados.cnpj,
                responsavelNome: dados.responsavelNome,
                responsavelEmail: dados.responsavelEmail,
                whatsappResponsavel: dados.whatsappResponsavel,
                status: dados.status as any,
                planoId: dados.planoId,
                planoNome: dados.planoNome,
                diasTrial: dados.diasTrial,
                trialInicio: dados.trialInicio ? new Date(dados.trialInicio) : undefined,
                trialFim: dados.trialFim ? new Date(dados.trialFim) : undefined,
                asaasCustomerId: dados.asaasCustomerId
            }
        });
    }
}
