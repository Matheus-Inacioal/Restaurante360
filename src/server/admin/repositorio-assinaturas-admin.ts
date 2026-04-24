import "server-only";
import { prisma } from "@/lib/prisma";
import { AssinaturaAsaas } from "@/lib/types/financeiro";

export const repositorioAssinaturasAdmin = {
    async obterTotalAtivas(): Promise<number> {
        return prisma.assinatura.count({
            where: {
                status: "ACTIVE"
            }
        });
    },

    async obterPorEmpresa(empresaId: string): Promise<any | null> {
        const a = await prisma.assinatura.findFirst({
            where: { empresaId }
        });

        if (!a) return null;
        return {
            id: a.id,
            ...a,
            proximoVencimento: a.proximoVencimento?.toISOString(),
            inicioAssinatura: a.inicioAssinatura.toISOString(),
            criadaEm: a.criadaEm.toISOString(),
            atualizadaEm: a.atualizadaEm.toISOString(),
        };
    },
};
