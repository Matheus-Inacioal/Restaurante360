import "server-only";
import "server-only";
import { prisma } from '@/lib/prisma';
import { Plano } from '@/lib/types/financeiro';

export const repositorioFinanceiroPlanos = {
    async listarPlanos(): Promise<Plano[]> {
        const planos = await prisma.plano.findMany({
            where: { ativo: true }
        });
        return planos.map(p => ({
            id: p.id,
            nome: p.nome,
            descricao: p.descricao,
            valorMensal: p.valorMensal,
            valorAnual: p.valorAnual,
            features: p.features,
            ativo: p.ativo,
            criadoEm: p.criadoEm.toISOString(),
            atualizadoEm: p.atualizadoEm.toISOString()
        } as Plano));
    },

    async obterPlanoPorId(planoId: string): Promise<Plano | null> {
        const plano = await prisma.plano.findUnique({
            where: { id: planoId }
        });
        if (!plano) return null;
        return {
            id: plano.id,
            nome: plano.nome,
            descricao: plano.descricao,
            valorMensal: plano.valorMensal,
            valorAnual: plano.valorAnual,
            features: plano.features,
            ativo: plano.ativo,
            criadoEm: plano.criadoEm.toISOString(),
            atualizadoEm: plano.atualizadoEm.toISOString()
        } as Plano;
    }
}
