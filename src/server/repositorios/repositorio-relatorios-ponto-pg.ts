/**
 * Repositório de Relatórios de Ponto — PostgreSQL/Prisma
 * Consultas agregadas para geração de relatórios.
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

// ─── Repositório ─────────────────────────────────────────────

export const repositorioRelatoriosPontoPg = {

  /** Obtém resumo mensal por empresa */
  async obterResumoMensal(empresaId: string, mes: number, ano: number) {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);

    const bancoHorasMensal = await prisma.bancoHoras.findMany({
      where: {
        empresaId,
        dataReferencia: { gte: dataInicio, lte: dataFim },
      },
      include: {
        colaborador: { select: { id: true, nome: true } },
      },
      orderBy: [{ colaboradorId: "asc" }, { dataReferencia: "asc" }],
    });

    // Agrupar por colaborador
    const resumoPorColaborador = new Map<string, {
      colaboradorId: string;
      colaboradorNome: string;
      totalTrabalhadoMinutos: number;
      totalHoraExtraMinutos: number;
      totalAtrasoMinutos: number;
      saldoFinalMinutos: number;
      diasTrabalhados: number;
    }>();

    for (const registro of bancoHorasMensal) {
      const existente = resumoPorColaborador.get(registro.colaboradorId);
      if (existente) {
        existente.totalTrabalhadoMinutos += registro.totalTrabalhadoMinutos;
        existente.totalHoraExtraMinutos += registro.horaExtraMinutos;
        existente.totalAtrasoMinutos += registro.atrasoMinutos;
        existente.saldoFinalMinutos += registro.saldoFinalMinutos;
        existente.diasTrabalhados += 1;
      } else {
        resumoPorColaborador.set(registro.colaboradorId, {
          colaboradorId: registro.colaboradorId,
          colaboradorNome: registro.colaborador.nome,
          totalTrabalhadoMinutos: registro.totalTrabalhadoMinutos,
          totalHoraExtraMinutos: registro.horaExtraMinutos,
          totalAtrasoMinutos: registro.atrasoMinutos,
          saldoFinalMinutos: registro.saldoFinalMinutos,
          diasTrabalhados: 1,
        });
      }
    }

    return Array.from(resumoPorColaborador.values());
  },

  /** Obtém resumo por colaborador em um mês */
  async obterResumoPorColaborador(
    empresaId: string,
    colaboradorId: string,
    mes: number,
    ano: number
  ) {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0);

    const registros = await prisma.bancoHoras.findMany({
      where: {
        empresaId,
        colaboradorId,
        dataReferencia: { gte: dataInicio, lte: dataFim },
      },
      orderBy: { dataReferencia: "asc" },
    });

    const totais = registros.reduce(
      (acc, reg) => ({
        totalTrabalhadoMinutos: acc.totalTrabalhadoMinutos + reg.totalTrabalhadoMinutos,
        totalPausasMinutos: acc.totalPausasMinutos + reg.totalPausasMinutos,
        totalAtrasoMinutos: acc.totalAtrasoMinutos + reg.atrasoMinutos,
        totalHoraExtraMinutos: acc.totalHoraExtraMinutos + reg.horaExtraMinutos,
        bancoPositivoMinutos: acc.bancoPositivoMinutos + reg.bancoPositivoMinutos,
        bancoNegativoMinutos: acc.bancoNegativoMinutos + reg.bancoNegativoMinutos,
        saldoFinalMinutos: acc.saldoFinalMinutos + reg.saldoFinalMinutos,
        diasTrabalhados: acc.diasTrabalhados + 1,
      }),
      {
        totalTrabalhadoMinutos: 0,
        totalPausasMinutos: 0,
        totalAtrasoMinutos: 0,
        totalHoraExtraMinutos: 0,
        bancoPositivoMinutos: 0,
        bancoNegativoMinutos: 0,
        saldoFinalMinutos: 0,
        diasTrabalhados: 0,
      }
    );

    return { registros, totais };
  },

  /** Obtém dados para fechamento mensal */
  async obterDadosFechamento(empresaId: string, mes: number, ano: number) {
    return prisma.fechamentoPonto.findMany({
      where: { empresaId, mes, ano },
      include: {
        colaborador: { select: { id: true, nome: true } },
        fechador: { select: { id: true, nome: true } },
      },
      orderBy: { colaborador: { nome: "asc" } },
    });
  },

  /** Cria ou atualiza fechamento mensal */
  async criarOuAtualizarFechamento(dados: {
    empresaId: string;
    colaboradorId: string;
    mes: number;
    ano: number;
    totalTrabalhadoMinutos: number;
    totalHoraExtraMinutos: number;
    totalAtrasoMinutos: number;
    totalFaltas: number;
    saldoBancoMinutos: number;
    diasTrabalhados: number;
    fechadoPor?: string;
    observacao?: string;
  }) {
    return prisma.fechamentoPonto.upsert({
      where: {
        empresaId_colaboradorId_mes_ano: {
          empresaId: dados.empresaId,
          colaboradorId: dados.colaboradorId,
          mes: dados.mes,
          ano: dados.ano,
        },
      },
      create: {
        empresaId: dados.empresaId,
        colaboradorId: dados.colaboradorId,
        mes: dados.mes,
        ano: dados.ano,
        totalTrabalhadoMinutos: dados.totalTrabalhadoMinutos,
        totalHoraExtraMinutos: dados.totalHoraExtraMinutos,
        totalAtrasoMinutos: dados.totalAtrasoMinutos,
        totalFaltas: dados.totalFaltas,
        saldoBancoMinutos: dados.saldoBancoMinutos,
        diasTrabalhados: dados.diasTrabalhados,
        status: dados.fechadoPor ? "fechado" : "aberto",
        fechadoPor: dados.fechadoPor ?? null,
        fechadoEm: dados.fechadoPor ? new Date() : null,
        observacao: dados.observacao ?? null,
      },
      update: {
        totalTrabalhadoMinutos: dados.totalTrabalhadoMinutos,
        totalHoraExtraMinutos: dados.totalHoraExtraMinutos,
        totalAtrasoMinutos: dados.totalAtrasoMinutos,
        totalFaltas: dados.totalFaltas,
        saldoBancoMinutos: dados.saldoBancoMinutos,
        diasTrabalhados: dados.diasTrabalhados,
        status: dados.fechadoPor ? "fechado" : "aberto",
        fechadoPor: dados.fechadoPor ?? undefined,
        fechadoEm: dados.fechadoPor ? new Date() : undefined,
        observacao: dados.observacao ?? undefined,
      },
    });
  },
};
