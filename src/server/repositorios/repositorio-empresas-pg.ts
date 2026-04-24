/**
 * Repositório de Empresas — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { StatusEmpresa } from "@prisma/client";

// ─── Tipos de entrada ─────────────────────────────────────────

export interface DadosCriarEmpresa {
  nome: string;
  cnpj: string;
  responsavelNome: string;
  responsavelEmail: string;
  whatsappResponsavel?: string;
  status?: StatusEmpresa;
  planoId?: string;
  planoNome?: string;
  diasTrial?: number;
}

export interface DadosAtualizarEmpresa {
  nome?: string;
  responsavelNome?: string;
  responsavelEmail?: string;
  whatsappResponsavel?: string;
  status?: StatusEmpresa;
  planoId?: string;
  planoNome?: string;
}

// ─── Repositório ──────────────────────────────────────────────

export const repositorioEmpresasPg = {

  /** Cria uma nova empresa (tenant) */
  async criar(dados: DadosCriarEmpresa) {
    return prisma.empresa.create({
      data: {
        nome: dados.nome,
        cnpj: dados.cnpj,
        responsavelNome: dados.responsavelNome,
        responsavelEmail: dados.responsavelEmail,
        whatsappResponsavel: dados.whatsappResponsavel,
        status: dados.status ?? "TRIAL_ATIVO",
        planoId: dados.planoId,
        planoNome: dados.planoNome,
        diasTrial: dados.diasTrial ?? 14,
        trialInicio: new Date(),
        trialFim: dados.diasTrial
          ? new Date(Date.now() + dados.diasTrial * 24 * 60 * 60 * 1000)
          : null,
      },
    });
  },

  /** Busca empresa por ID */
  async obterPorId(id: string) {
    return prisma.empresa.findUnique({
      where: { id },
      include: {
        unidades: { where: { status: "ativo" }, orderBy: { nome: "asc" } },
        areas: { where: { status: "ativo" }, orderBy: { nome: "asc" } },
      },
    });
  },

  /** Busca empresa por CNPJ */
  async obterPorCnpj(cnpj: string) {
    return prisma.empresa.findUnique({ where: { cnpj } });
  },

  /** Lista todas as empresas (para saasAdmin) */
  async listarTodas() {
    return prisma.empresa.findMany({
      orderBy: { criadoEm: "desc" },
      include: {
        _count: {
          select: { unidades: true, usuarios: true },
        },
      },
    });
  },

  /** Atualiza dados de uma empresa */
  async atualizar(id: string, dados: DadosAtualizarEmpresa) {
    return prisma.empresa.update({
      where: { id },
      data: dados,
    });
  },

  /** Altera o status da empresa */
  async alterarStatus(id: string, status: StatusEmpresa) {
    return prisma.empresa.update({
      where: { id },
      data: { status },
    });
  },
};
