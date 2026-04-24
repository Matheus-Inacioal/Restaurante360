/**
 * Repositório de Áreas — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface DadosCriarArea {
  empresaId: string;
  nome: string;
  descricao?: string;
}

export const repositorioAreasPg = {

  async criar(dados: DadosCriarArea) {
    return prisma.area.create({ data: dados });
  },

  async listarPorEmpresa(empresaId: string) {
    return prisma.area.findMany({
      where: { empresaId, status: "ativo" },
      include: {
        funcoes: {
          where: { status: "ativo" },
          orderBy: { nome: "asc" },
        },
      },
      orderBy: { nome: "asc" },
    });
  },

  async obterPorId(id: string, empresaId: string) {
    return prisma.area.findFirst({
      where: { id, empresaId },
      include: { funcoes: { where: { status: "ativo" } } },
    });
  },

  async atualizar(id: string, empresaId: string, dados: { nome?: string; descricao?: string }) {
    const area = await prisma.area.findFirst({ where: { id, empresaId } });
    if (!area) throw new Error("Área não encontrada ou sem permissão.");
    return prisma.area.update({ where: { id }, data: dados });
  },

  async inativar(id: string, empresaId: string) {
    const area = await prisma.area.findFirst({ where: { id, empresaId } });
    if (!area) throw new Error("Área não encontrada ou sem permissão.");
    return prisma.area.update({ where: { id }, data: { status: "inativo" } });
  },
};
