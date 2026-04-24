/**
 * Repositório de Auditoria — PostgreSQL/Prisma
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export const repositorioAuditoriaPg = {

  async criar(dados: {
    usuarioId: string;
    acao: string;
    entidade: string;
    entidadeId: string;
    empresaId?: string | null;
    detalhe?: Record<string, any> | null;
  }) {
    return prisma.auditoria.create({
      data: {
        usuarioId: dados.usuarioId,
        acao: dados.acao,
        entidade: dados.entidade,
        entidadeId: dados.entidadeId,
        empresaId: dados.empresaId ?? null,
        detalhe: dados.detalhe ?? undefined,
      },
    });
  },

  async listarPorEmpresa(empresaId: string, limite = 50) {
    return prisma.auditoria.findMany({
      where: { empresaId },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { criadoEm: "desc" },
      take: limite,
    });
  },

  async listarPorEntidade(entidade: string, entidadeId: string) {
    return prisma.auditoria.findMany({
      where: { entidade, entidadeId },
      include: {
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
  },
};
