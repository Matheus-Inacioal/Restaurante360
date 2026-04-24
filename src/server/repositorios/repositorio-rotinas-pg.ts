/**
 * Repositório de Rotinas — PostgreSQL/Prisma
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

export interface DadosCriarRotina {
  empresaId: string;
  titulo: string;
  descricao?: string;
  frequencia: "diaria" | "semanal" | "mensal";
  diasSemana?: number[];
  diaDoMes?: number;
  horarioPreferencial?: string;
  responsavelPadraoId?: string;
  tipoTarefaGerada?: "tarefa" | "checklist";
  checklistModelo?: any;
  tags?: string[];
  criadoPor: string;
}

export interface DadosAtualizarRotina {
  titulo?: string;
  descricao?: string;
  ativa?: boolean;
  frequencia?: "diaria" | "semanal" | "mensal";
  diasSemana?: number[];
  diaDoMes?: number;
  horarioPreferencial?: string;
  responsavelPadraoId?: string | null;
  checklistModelo?: any;
  tags?: string[];
}

export const repositorioRotinasPg = {

  async criar(dados: DadosCriarRotina) {
    return prisma.rotina.create({
      data: {
        empresaId: dados.empresaId,
        titulo: dados.titulo,
        descricao: dados.descricao ?? null,
        frequencia: dados.frequencia,
        diasSemana: dados.diasSemana ?? [],
        diaDoMes: dados.diaDoMes ?? null,
        horarioPreferencial: dados.horarioPreferencial ?? null,
        responsavelPadraoId: dados.responsavelPadraoId ?? null,
        tipoTarefaGerada: dados.tipoTarefaGerada ?? "tarefa",
        checklistModelo: dados.checklistModelo ?? undefined,
        tags: dados.tags ?? [],
        criadoPor: dados.criadoPor,
      },
    });
  },

  async listarPorEmpresa(empresaId: string, apenasAtivas = false) {
    return prisma.rotina.findMany({
      where: {
        empresaId,
        ...(apenasAtivas ? { ativa: true } : {}),
      },
      include: {
        criador: { select: { id: true, nome: true } },
        _count: { select: { geracoes: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
  },

  async obterPorId(id: string) {
    return prisma.rotina.findUnique({
      where: { id },
      include: {
        criador: { select: { id: true, nome: true } },
        geracoes: { take: 10, orderBy: { criadoEm: "desc" } },
      },
    });
  },

  async atualizar(id: string, dados: DadosAtualizarRotina) {
    return prisma.rotina.update({ where: { id }, data: dados });
  },

  async alternarAtiva(id: string, ativa: boolean) {
    return prisma.rotina.update({ where: { id }, data: { ativa } });
  },

  async deletar(id: string) {
    return prisma.rotina.delete({ where: { id } });
  },

  async registrarGeracao(rotinaId: string, tarefaGeradaId: string, dataReferencia: string, empresaId: string) {
    return prisma.geracaoRotina.upsert({
      where: { rotinaId_dataReferencia: { rotinaId, dataReferencia } },
      update: {},
      create: { rotinaId, tarefaGeradaId, dataReferencia, empresaId },
    });
  },

  async verificarGeracaoExiste(rotinaId: string, dataReferencia: string): Promise<boolean> {
    const geracao = await prisma.geracaoRotina.findUnique({
      where: { rotinaId_dataReferencia: { rotinaId, dataReferencia } },
    });
    return geracao !== null;
  },
};
