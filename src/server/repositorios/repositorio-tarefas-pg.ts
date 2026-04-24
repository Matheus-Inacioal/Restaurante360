/**
 * Repositório de Tarefas — PostgreSQL/Prisma
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface DadosCriarTarefa {
  empresaId: string;
  titulo: string;
  descricao?: string;
  tipo?: "tarefa" | "checklist";
  prioridade?: "Alta" | "Media" | "Baixa";
  responsavelId?: string;
  prazo?: Date | null;
  tags?: string[];
  itensVerificacao?: any;
  criadoPor: string;
}

export interface DadosAtualizarTarefa {
  titulo?: string;
  descricao?: string;
  status?: "pendente" | "em_progresso" | "concluida" | "atrasada";
  prioridade?: "Alta" | "Media" | "Baixa";
  responsavelId?: string | null;
  prazo?: Date | null;
  tags?: string[];
  itensVerificacao?: any;
}

export const repositorioTarefasPg = {

  async criar(dados: DadosCriarTarefa) {
    return prisma.tarefa.create({
      data: {
        empresaId: dados.empresaId,
        titulo: dados.titulo,
        descricao: dados.descricao ?? null,
        tipo: dados.tipo ?? "tarefa",
        prioridade: dados.prioridade ?? "Media",
        responsavelId: dados.responsavelId ?? null,
        prazo: dados.prazo ?? null,
        tags: dados.tags ?? [],
        itensVerificacao: dados.itensVerificacao ?? undefined,
        criadoPor: dados.criadoPor,
      },
      include: {
        responsavel: { select: { id: true, nome: true } },
        criador: { select: { id: true, nome: true } },
      },
    });
  },

  async listarPorEmpresa(empresaId: string, filtros?: { status?: string; responsavelId?: string }) {
    return prisma.tarefa.findMany({
      where: {
        empresaId,
        ...(filtros?.status ? { status: filtros.status as any } : {}),
        ...(filtros?.responsavelId ? { responsavelId: filtros.responsavelId } : {}),
      },
      include: {
        responsavel: { select: { id: true, nome: true } },
        criador: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
  },

  async obterPorId(id: string) {
    return prisma.tarefa.findUnique({
      where: { id },
      include: {
        responsavel: { select: { id: true, nome: true } },
        criador: { select: { id: true, nome: true } },
      },
    });
  },

  async atualizar(id: string, dados: DadosAtualizarTarefa) {
    return prisma.tarefa.update({
      where: { id },
      data: dados,
    });
  },

  async deletar(id: string) {
    return prisma.tarefa.delete({ where: { id } });
  },

  async contarPorStatus(empresaId: string) {
    return prisma.tarefa.groupBy({
      by: ["status"],
      where: { empresaId },
      _count: { id: true },
    });
  },
};
