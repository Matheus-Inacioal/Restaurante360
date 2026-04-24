import "server-only";
import { prisma } from "@/lib/prisma";
import { LogAuditoria } from "@/lib/types/auditoria";

export const repositorioAuditoriaAdmin = {
    async registrarLog(log: Omit<LogAuditoria, "id" | "criadoEm">): Promise<void> {
        await prisma.auditoria.create({
            data: {
                empresaId: log.empresaId,
                usuarioId: log.usuarioId,
                acao: log.tipo, // Mapeando tipo para acao no model
                entidade: "sistema", // Default ou pode extrair do tipo
                entidadeId: log.usuarioAlvoUid || log.usuarioId,
                detalhe: log.metadata || {},
            }
        });
    },

    async listarRecentes(limit: number = 20): Promise<any[]> {
        const registros = await prisma.auditoria.findMany({
            orderBy: { criadoEm: "desc" },
            take: limit,
        });

        return registros.map(r => ({
            id: r.id,
            tipo: r.acao,
            empresaId: r.empresaId,
            usuarioId: r.usuarioId,
            usuarioAlvoUid: r.entidadeId,
            metadata: r.detalhe,
            criadoEm: r.criadoEm.toISOString(),
        }));
    },
};
