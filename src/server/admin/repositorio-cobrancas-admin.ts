import "server-only";
import { prisma } from "@/lib/prisma";

export const repositorioCobrancasAdmin = {
    async listarPorEmpresa(empresaId: string): Promise<any[]> {
        const cobrancas = await prisma.cobranca.findMany({
            where: { empresaId },
            orderBy: { vencimento: "desc" }
        });

        return cobrancas.map(c => ({
            id: c.id,
            ...c,
            vencimento: c.vencimento.toISOString(),
            pagaEm: c.pagaEm?.toISOString(),
            criadaEm: c.criadaEm.toISOString(),
            atualizadaEm: c.atualizadaEm.toISOString(),
        }));
    },
};
