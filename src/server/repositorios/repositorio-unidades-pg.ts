/**
 * Repositório de Unidades — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { StatusAtivo } from "@/lib/tipos/identidade";

export interface DadosCriarUnidade {
  empresaId: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

export interface DadosAtualizarUnidade {
  nome?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  status?: StatusAtivo;
}

export const repositorioUnidadesPg = {

  async criar(dados: DadosCriarUnidade) {
    return prisma.unidade.create({ data: dados });
  },

  async obterPorId(id: string, empresaId: string) {
    return prisma.unidade.findFirst({
      where: { id, empresaId },
      include: {
        usuarios: {
          where: { status: "ativo" },
          select: { id: true, nome: true, papel: true },
        },
      },
    });
  },

  async listarPorEmpresa(empresaId: string) {
    return prisma.unidade.findMany({
      where: { empresaId },
      orderBy: { nome: "asc" },
    });
  },

  async atualizar(id: string, empresaId: string, dados: DadosAtualizarUnidade) {
    // Garante que a unidade pertence à empresa (segurança tenant)
    const unidade = await prisma.unidade.findFirst({ where: { id, empresaId } });
    if (!unidade) throw new Error("Unidade não encontrada ou sem permissão.");
    return prisma.unidade.update({ where: { id }, data: dados });
  },

  async inativar(id: string, empresaId: string) {
    const unidade = await prisma.unidade.findFirst({ where: { id, empresaId } });
    if (!unidade) throw new Error("Unidade não encontrada ou sem permissão.");
    return prisma.unidade.update({ where: { id }, data: { status: "inativo" } });
  },
};
