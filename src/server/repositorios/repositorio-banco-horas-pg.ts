/**
 * Repositório de Banco de Horas — PostgreSQL/Prisma
 * Camada de acesso a dados para saldos diários e acumulados.
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

// ─── Interfaces ──────────────────────────────────────────────

export interface DadosBancoHoras {
  empresaId: string;
  colaboradorId: string;
  dataReferencia: Date;
  totalTrabalhadoMinutos: number;
  totalPausasMinutos: number;
  atrasoMinutos: number;
  saidaAntecipadaMinutos: number;
  horaExtraMinutos: number;
  bancoPositivoMinutos: number;
  bancoNegativoMinutos: number;
  saldoFinalMinutos: number;
  jornadaPrevistaMinutos: number;
}

// ─── Repositório ─────────────────────────────────────────────

export const repositorioBancoHorasPg = {

  /** Cria ou atualiza o saldo de banco de horas para um dia */
  async criarOuAtualizar(dados: DadosBancoHoras) {
    return prisma.bancoHoras.upsert({
      where: {
        empresaId_colaboradorId_dataReferencia: {
          empresaId: dados.empresaId,
          colaboradorId: dados.colaboradorId,
          dataReferencia: dados.dataReferencia,
        },
      },
      create: dados,
      update: {
        totalTrabalhadoMinutos: dados.totalTrabalhadoMinutos,
        totalPausasMinutos: dados.totalPausasMinutos,
        atrasoMinutos: dados.atrasoMinutos,
        saidaAntecipadaMinutos: dados.saidaAntecipadaMinutos,
        horaExtraMinutos: dados.horaExtraMinutos,
        bancoPositivoMinutos: dados.bancoPositivoMinutos,
        bancoNegativoMinutos: dados.bancoNegativoMinutos,
        saldoFinalMinutos: dados.saldoFinalMinutos,
        jornadaPrevistaMinutos: dados.jornadaPrevistaMinutos,
      },
    });
  },

  /** Obtém o saldo de um período */
  async obterSaldoPeriodo(
    empresaId: string,
    colaboradorId: string,
    dataInicio: Date,
    dataFim: Date
  ) {
    return prisma.bancoHoras.findMany({
      where: {
        empresaId,
        colaboradorId,
        dataReferencia: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      orderBy: { dataReferencia: "asc" },
    });
  },

  /** Obtém o saldo acumulado total de um colaborador */
  async obterSaldoAcumulado(empresaId: string, colaboradorId: string) {
    const resultado = await prisma.bancoHoras.aggregate({
      where: { empresaId, colaboradorId },
      _sum: {
        saldoFinalMinutos: true,
        totalTrabalhadoMinutos: true,
        horaExtraMinutos: true,
        atrasoMinutos: true,
        bancoPositivoMinutos: true,
        bancoNegativoMinutos: true,
      },
      _count: { id: true },
    });

    return {
      saldoAcumuladoMinutos: resultado._sum.saldoFinalMinutos ?? 0,
      totalTrabalhadoMinutos: resultado._sum.totalTrabalhadoMinutos ?? 0,
      totalHoraExtraMinutos: resultado._sum.horaExtraMinutos ?? 0,
      totalAtrasoMinutos: resultado._sum.atrasoMinutos ?? 0,
      bancoPositivoMinutos: resultado._sum.bancoPositivoMinutos ?? 0,
      bancoNegativoMinutos: resultado._sum.bancoNegativoMinutos ?? 0,
      diasRegistrados: resultado._count.id,
    };
  },

  /** Obtém saldo de um dia específico */
  async obterSaldoDia(empresaId: string, colaboradorId: string, dataReferencia: Date) {
    return prisma.bancoHoras.findUnique({
      where: {
        empresaId_colaboradorId_dataReferencia: {
          empresaId,
          colaboradorId,
          dataReferencia,
        },
      },
    });
  },

  /** Obtém saldo acumulado do mês */
  async obterSaldoMensal(empresaId: string, colaboradorId: string, mes: number, ano: number) {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0); // Último dia do mês

    const resultado = await prisma.bancoHoras.aggregate({
      where: {
        empresaId,
        colaboradorId,
        dataReferencia: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _sum: {
        saldoFinalMinutos: true,
        totalTrabalhadoMinutos: true,
        horaExtraMinutos: true,
        atrasoMinutos: true,
        totalPausasMinutos: true,
        bancoPositivoMinutos: true,
        bancoNegativoMinutos: true,
      },
      _count: { id: true },
    });

    return {
      saldoMensalMinutos: resultado._sum.saldoFinalMinutos ?? 0,
      totalTrabalhadoMinutos: resultado._sum.totalTrabalhadoMinutos ?? 0,
      totalHoraExtraMinutos: resultado._sum.horaExtraMinutos ?? 0,
      totalAtrasoMinutos: resultado._sum.atrasoMinutos ?? 0,
      totalPausasMinutos: resultado._sum.totalPausasMinutos ?? 0,
      bancoPositivoMinutos: resultado._sum.bancoPositivoMinutos ?? 0,
      bancoNegativoMinutos: resultado._sum.bancoNegativoMinutos ?? 0,
      diasTrabalhados: resultado._count.id,
    };
  },
};
