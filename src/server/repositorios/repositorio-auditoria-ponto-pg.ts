/**
 * Repositório de Auditoria de Ponto — PostgreSQL/Prisma
 * Registra e consulta logs detalhados de alterações em registros de ponto.
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { TipoAlteracaoPonto } from "@prisma/client";

// ─── Interface de Dados ──────────────────────────────────────

export interface DadosAuditoriaPonto {
  empresaId: string;
  registroOriginalId?: string | null;
  tipoAlteracao: TipoAlteracaoPonto;
  valorAnterior?: Record<string, unknown> | null;
  valorNovo?: Record<string, unknown> | null;
  motivo?: string | null;
  responsavelId: string;
  ip?: string | null;
  userAgent?: string | null;
}

// ─── Repositório ─────────────────────────────────────────────

export const repositorioAuditoriaPontoPg = {

  /** Registra um log de auditoria */
  async registrar(dados: DadosAuditoriaPonto) {
    return prisma.auditoriaPonto.create({
      data: {
        empresaId: dados.empresaId,
        registroOriginalId: dados.registroOriginalId ?? null,
        tipoAlteracao: dados.tipoAlteracao,
        valorAnterior: dados.valorAnterior ?? undefined,
        valorNovo: dados.valorNovo ?? undefined,
        motivo: dados.motivo ?? null,
        responsavelId: dados.responsavelId,
        ip: dados.ip ?? null,
        userAgent: dados.userAgent ?? null,
      },
    });
  },

  /** Lista logs de auditoria de um registro de ponto específico */
  async listarPorRegistro(registroOriginalId: string) {
    return prisma.auditoriaPonto.findMany({
      where: { registroOriginalId },
      include: {
        responsavel: { select: { id: true, nome: true } },
      },
      orderBy: { dataAlteracao: "desc" },
    });
  },

  /** Lista logs de auditoria por período */
  async listarPorPeriodo(empresaId: string, dataInicio: Date, dataFim: Date) {
    return prisma.auditoriaPonto.findMany({
      where: {
        empresaId,
        dataAlteracao: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      include: {
        responsavel: { select: { id: true, nome: true } },
        registroOriginal: {
          select: {
            id: true,
            tipoRegistro: true,
            colaboradorId: true,
            dataReferencia: true,
            colaborador: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { dataAlteracao: "desc" },
      take: 200, // Limitar para performance
    });
  },

  /** Conta alterações por tipo num período */
  async contarPorTipo(empresaId: string, dataInicio: Date, dataFim: Date) {
    return prisma.auditoriaPonto.groupBy({
      by: ["tipoAlteracao"],
      where: {
        empresaId,
        dataAlteracao: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _count: { id: true },
    });
  },
};
