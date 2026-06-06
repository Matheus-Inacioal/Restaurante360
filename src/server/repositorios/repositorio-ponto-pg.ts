/**
 * Repositório de Ponto — PostgreSQL/Prisma
 * Camada de acesso a dados para registros de ponto.
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { TipoRegistroPonto, StatusRegistroPonto, OrigemRegistroPonto } from "@prisma/client";

// ─── Interfaces de Dados ─────────────────────────────────────

export interface DadosCriarRegistroPonto {
  empresaId: string;
  unidadeId: string;
  colaboradorId: string;
  tipoRegistro: TipoRegistroPonto;
  dataReferencia: Date;
  horarioRegistro: Date;
  latitude?: number | null;
  longitude?: number | null;
  dentroRaioPermitido?: boolean;
  distanciaMetros?: number | null;
  origemRegistro?: OrigemRegistroPonto;
  statusRegistro?: StatusRegistroPonto;
  observacao?: string | null;
  criadoPor: string;
}

export interface FiltrosListagemPonto {
  empresaId: string;
  colaboradorId?: string;
  unidadeId?: string;
  dataInicio?: Date;
  dataFim?: Date;
  status?: StatusRegistroPonto;
  dataReferencia?: Date;
}

// ─── Includes padrão ─────────────────────────────────────────

const incluirRelacionamentos = {
  colaborador: { select: { id: true, nome: true } },
  criador: { select: { id: true, nome: true } },
  pausas: true,
} as const;

// ─── Repositório ─────────────────────────────────────────────

export const repositorioPontoPg = {

  /** Cria um novo registro de ponto (batida) */
  async criarRegistro(dados: DadosCriarRegistroPonto) {
    return prisma.registroPonto.create({
      data: {
        empresaId: dados.empresaId,
        unidadeId: dados.unidadeId,
        colaboradorId: dados.colaboradorId,
        tipoRegistro: dados.tipoRegistro,
        dataReferencia: dados.dataReferencia,
        horarioRegistro: dados.horarioRegistro,
        latitude: dados.latitude ?? null,
        longitude: dados.longitude ?? null,
        dentroRaioPermitido: dados.dentroRaioPermitido ?? true,
        distanciaMetros: dados.distanciaMetros ?? null,
        origemRegistro: dados.origemRegistro ?? "app_web",
        statusRegistro: dados.statusRegistro ?? "valido",
        observacao: dados.observacao ?? null,
        criadoPor: dados.criadoPor,
      },
      include: incluirRelacionamentos,
    });
  },

  /** Obtém todos os registros de ponto de um colaborador num dia */
  async obterRegistrosDia(empresaId: string, colaboradorId: string, dataReferencia: Date) {
    return prisma.registroPonto.findMany({
      where: {
        empresaId,
        colaboradorId,
        dataReferencia,
        deletadoEm: null,
      },
      include: incluirRelacionamentos,
      orderBy: { horarioRegistro: "asc" },
    });
  },

  /** Obtém o último registro de ponto de um colaborador (qualquer dia) */
  async obterUltimoRegistro(empresaId: string, colaboradorId: string) {
    return prisma.registroPonto.findFirst({
      where: {
        empresaId,
        colaboradorId,
        deletadoEm: null,
      },
      orderBy: { horarioRegistro: "desc" },
      include: incluirRelacionamentos,
    });
  },

  /** Obtém um registro de ponto por ID */
  async obterPorId(id: string) {
    return prisma.registroPonto.findUnique({
      where: { id },
      include: {
        ...incluirRelacionamentos,
        ajustes: {
          include: { criador: { select: { id: true, nome: true } } },
        },
        justificativas: {
          include: {
            criador: { select: { id: true, nome: true } },
            aprovador: { select: { id: true, nome: true } },
          },
        },
      },
    });
  },

  /** Lista registros de ponto com filtros */
  async listarPorPeriodo(filtros: FiltrosListagemPonto) {
    const where: Record<string, unknown> = {
      empresaId: filtros.empresaId,
      deletadoEm: null,
    };

    if (filtros.colaboradorId) where.colaboradorId = filtros.colaboradorId;
    if (filtros.unidadeId) where.unidadeId = filtros.unidadeId;
    if (filtros.status) where.statusRegistro = filtros.status;
    if (filtros.dataReferencia) where.dataReferencia = filtros.dataReferencia;

    if (filtros.dataInicio || filtros.dataFim) {
      where.dataReferencia = {
        ...(filtros.dataInicio ? { gte: filtros.dataInicio } : {}),
        ...(filtros.dataFim ? { lte: filtros.dataFim } : {}),
      };
    }

    return prisma.registroPonto.findMany({
      where: where as any,
      include: incluirRelacionamentos,
      orderBy: [{ dataReferencia: "desc" }, { horarioRegistro: "asc" }],
    });
  },

  /** Lista registros de ponto por unidade e data (para tela do gestor) */
  async listarPorUnidadeEData(empresaId: string, unidadeId: string, dataReferencia: Date) {
    return prisma.registroPonto.findMany({
      where: {
        empresaId,
        unidadeId,
        dataReferencia,
        deletadoEm: null,
      },
      include: incluirRelacionamentos,
      orderBy: [{ colaboradorId: "asc" }, { horarioRegistro: "asc" }],
    });
  },

  /** Atualiza o status de um registro */
  async atualizarStatus(id: string, statusRegistro: StatusRegistroPonto) {
    return prisma.registroPonto.update({
      where: { id },
      data: { statusRegistro },
    });
  },

  /** Atualiza o horário de um registro (ajuste) */
  async atualizarHorario(id: string, horarioRegistro: Date) {
    return prisma.registroPonto.update({
      where: { id },
      data: { horarioRegistro, statusRegistro: "ajustado" },
    });
  },

  /** Soft delete de um registro */
  async softDelete(id: string) {
    return prisma.registroPonto.update({
      where: { id },
      data: { deletadoEm: new Date() },
    });
  },

  /** Obtém pausas abertas de um colaborador no dia */
  async obterPausasAbertas(empresaId: string, colaboradorId: string, dataReferencia: Date) {
    return prisma.pausaPonto.findMany({
      where: {
        empresaId,
        colaboradorId,
        fim: null,
        registroPonto: {
          dataReferencia,
          deletadoEm: null,
        },
      },
    });
  },

  /** Cria uma pausa */
  async criarPausa(dados: {
    empresaId: string;
    registroPontoId: string;
    colaboradorId: string;
    inicio: Date;
    tipo?: string;
  }) {
    return prisma.pausaPonto.create({
      data: {
        empresaId: dados.empresaId,
        registroPontoId: dados.registroPontoId,
        colaboradorId: dados.colaboradorId,
        inicio: dados.inicio,
        tipo: dados.tipo ?? "almoco",
      },
    });
  },

  /** Finaliza uma pausa aberta */
  async finalizarPausa(pausaId: string, fim: Date) {
    const pausa = await prisma.pausaPonto.findUnique({ where: { id: pausaId } });
    if (!pausa) throw new Error("Pausa não encontrada.");

    const duracaoMinutos = Math.round((fim.getTime() - pausa.inicio.getTime()) / 60000);

    return prisma.pausaPonto.update({
      where: { id: pausaId },
      data: { fim, duracaoMinutos },
    });
  },

  /** Cria um ajuste de ponto */
  async criarAjuste(dados: {
    empresaId: string;
    registroPontoId: string;
    horarioOriginal: Date;
    horarioAjustado: Date;
    motivo: string;
    criadoPor: string;
  }) {
    return prisma.ajustePonto.create({
      data: dados,
      include: { criador: { select: { id: true, nome: true } } },
    });
  },

  /** Cria uma justificativa */
  async criarJustificativa(dados: {
    empresaId: string;
    registroPontoId?: string;
    colaboradorId: string;
    dataReferencia: Date;
    motivo: string;
    observacao?: string;
    anexoUrl?: string;
    criadoPor: string;
  }) {
    return prisma.justificativaPonto.create({
      data: {
        empresaId: dados.empresaId,
        registroPontoId: dados.registroPontoId ?? null,
        colaboradorId: dados.colaboradorId,
        dataReferencia: dados.dataReferencia,
        motivo: dados.motivo,
        observacao: dados.observacao ?? null,
        anexoUrl: dados.anexoUrl ?? null,
        criadoPor: dados.criadoPor,
      },
      include: { criador: { select: { id: true, nome: true } } },
    });
  },

  /** Aprova ou recusa uma justificativa */
  async atualizarJustificativa(
    id: string,
    aprovadoPor: string,
    aprovado: boolean,
    motivoRecusa?: string
  ) {
    return prisma.justificativaPonto.update({
      where: { id },
      data: {
        status: aprovado ? "aprovada" : "recusada",
        aprovadoPor,
        aprovadoEm: new Date(),
        motivoRecusa: !aprovado ? motivoRecusa : null,
      },
    });
  },

  /** Lista justificativas pendentes */
  async listarJustificativasPendentes(empresaId: string) {
    return prisma.justificativaPonto.findMany({
      where: { empresaId, status: "pendente_aprovacao" },
      include: {
        criador: { select: { id: true, nome: true } },
        registroPonto: true,
      },
      orderBy: { criadoEm: "desc" },
    });
  },

  /** Obtém colaboradores de uma unidade (para tela do gestor) */
  async obterColaboradoresUnidade(empresaId: string, unidadeId: string) {
    return prisma.usuario.findMany({
      where: {
        empresaId,
        unidadeId,
        status: "ativo",
        papel: { in: ["operacional", "gestorLocal"] },
      },
      select: { id: true, nome: true, papel: true },
      orderBy: { nome: "asc" },
    });
  },

  /** Obtém a jornada prevista de um colaborador para um dia da semana */
  async obterJornadaPrevista(colaboradorId: string, diaSemana: string) {
    return prisma.jornadaPrevista.findFirst({
      where: {
        colaboradorId,
        diaSemana: diaSemana as any,
        escala: { ativa: true },
      },
      include: { escala: true },
    });
  },

  /** Obtém a escala ativa de uma unidade */
  async obterEscalaAtiva(empresaId: string, unidadeId?: string) {
    return prisma.escalaTrabalho.findFirst({
      where: {
        empresaId,
        ...(unidadeId ? { unidadeId } : {}),
        ativa: true,
      },
    });
  },

  /** Obtém a unidade com dados de geolocalização */
  async obterUnidadeComGeo(unidadeId: string) {
    return prisma.unidade.findUnique({
      where: { id: unidadeId },
      select: {
        id: true,
        nome: true,
        latitude: true,
        longitude: true,
        raioPermitidoMetros: true,
      },
    });
  },
};
