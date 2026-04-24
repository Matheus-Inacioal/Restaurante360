/**
 * Repositório de Funções/Cargos — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface DadosCriarFuncao {
  areaId: string;
  nome: string;
  descricao?: string;
}

export const repositorioFuncoesPg = {

  async criar(dados: DadosCriarFuncao) {
    return prisma.funcao.create({ data: dados });
  },

  /** Lista funções de uma área, validando que a área pertence à empresa */
  async listarPorArea(areaId: string, empresaId: string) {
    // Valida que a área pertence à empresa
    const area = await prisma.area.findFirst({ where: { id: areaId, empresaId } });
    if (!area) throw new Error("Área não encontrada ou sem permissão.");

    return prisma.funcao.findMany({
      where: { areaId, status: "ativo" },
      orderBy: { nome: "asc" },
    });
  },

  /** Lista todas as funções de uma empresa (via áreas) */
  async listarPorEmpresa(empresaId: string) {
    return prisma.funcao.findMany({
      where: {
        area: { empresaId },
        status: "ativo",
      },
      include: {
        area: { select: { id: true, nome: true } },
      },
      orderBy: { nome: "asc" },
    });
  },

  async atualizar(id: string, empresaId: string, dados: { nome?: string; descricao?: string }) {
    // Valida via área → empresa
    const funcao = await prisma.funcao.findFirst({
      where: { id, area: { empresaId } },
    });
    if (!funcao) throw new Error("Função não encontrada ou sem permissão.");
    return prisma.funcao.update({ where: { id }, data: dados });
  },

  async inativar(id: string, empresaId: string) {
    const funcao = await prisma.funcao.findFirst({
      where: { id, area: { empresaId } },
    });
    if (!funcao) throw new Error("Função não encontrada ou sem permissão.");
    return prisma.funcao.update({ where: { id }, data: { status: "inativo" } });
  },
};
