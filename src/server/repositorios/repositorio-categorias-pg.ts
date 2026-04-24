/**
 * Repositório de Categorias — PostgreSQL/Prisma
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export const repositorioCategoriasPg = {

  async criar(empresaId: string, nome: string, tipo?: string) {
    return prisma.categoria.create({
      data: {
        empresaId,
        nome,
        tipo: (tipo as any) ?? "geral",
        ativa: true,
      },
    });
  },

  async listarPorEmpresa(empresaId: string) {
    return prisma.categoria.findMany({
      where: { empresaId, ativa: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });
  },

  async obterPorId(id: string) {
    return prisma.categoria.findUnique({ where: { id } });
  },

  async atualizar(id: string, dados: { nome?: string; tipo?: string; ativa?: boolean; ordem?: number }) {
    return prisma.categoria.update({ where: { id }, data: dados });
  },

  async deletar(id: string) {
    return prisma.categoria.delete({ where: { id } });
  },
};
