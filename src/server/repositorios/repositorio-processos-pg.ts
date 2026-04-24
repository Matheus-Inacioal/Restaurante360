/**
 * Repositório de Processos — PostgreSQL/Prisma
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface DadosCriarProcesso {
  empresaId: string;
  titulo: string;
  descricao?: string;
  categoriaId?: string;
  passos?: any[];
}

export const repositorioProcessosPg = {

  async criar(dados: DadosCriarProcesso) {
    return prisma.processo.create({
      data: {
        empresaId: dados.empresaId,
        titulo: dados.titulo,
        descricao: dados.descricao ?? null,
        categoriaId: dados.categoriaId ?? null,
        passos: dados.passos ?? undefined,
      },
      include: {
        categoria: { select: { id: true, nome: true } },
      },
    });
  },

  async listarPorEmpresa(empresaId: string) {
    return prisma.processo.findMany({
      where: { empresaId },
      include: {
        categoria: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
  },

  async obterPorId(id: string) {
    return prisma.processo.findUnique({
      where: { id },
      include: {
        categoria: { select: { id: true, nome: true } },
      },
    });
  },

  async atualizar(id: string, dados: Partial<DadosCriarProcesso> & { ativo?: boolean; versao?: number }) {
    return prisma.processo.update({ where: { id }, data: dados });
  },

  async deletar(id: string) {
    return prisma.processo.delete({ where: { id } });
  },
};
