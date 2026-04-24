import "server-only";
import { prisma } from "@/lib/prisma";
import { Plano } from "@/lib/types/financeiro";

export const repositorioPlanosAdmin = {
    async listar(): Promise<any[]> {
        const planos = await prisma.plano.findMany({
            where: { ativo: true }
        });

        return planos.map(p => ({
            id: p.id,
            ...p,
            criadoEm: p.criadoEm.toISOString(),
            atualizadoEm: p.atualizadoEm.toISOString(),
        }));
    },

    async obterPorId(id: string): Promise<any | null> {
        const p = await prisma.plano.findUnique({
            where: { id }
        });
        if (!p) return null;

        return {
            id: p.id,
            ...p,
            criadoEm: p.criadoEm.toISOString(),
            atualizadoEm: p.atualizadoEm.toISOString(),
        };
    },
};
