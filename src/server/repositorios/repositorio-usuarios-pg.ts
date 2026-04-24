/**
 * Repositório de Usuários — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { PapelUsuario, StatusAtivo } from "@/lib/tipos/identidade";

// ─── Tipos de entrada ─────────────────────────────────────────

export interface DadosCriarUsuario {
  id?: string;          // Opcional — se não informado, o Prisma gera via cuid()
  email: string;
  nome: string;
  papel: PapelUsuario;
  empresaId?: string;
  unidadeId?: string;
  areaId?: string;
  funcaoId?: string;
  senhaHash?: string;
  mustResetPassword?: boolean;
}

export interface DadosAtualizarUsuario {
  nome?: string;
  papel?: PapelUsuario;
  unidadeId?: string | null;
  areaId?: string | null;
  funcaoId?: string | null;
  status?: StatusAtivo;
  senhaHash?: string;
  mustResetPassword?: boolean;
}

// ─── Repositório ──────────────────────────────────────────────

export const repositorioUsuariosPg = {

  /** Cria um novo usuário no PostgreSQL */
  async criar(dados: DadosCriarUsuario) {
    return prisma.usuario.create({
      data: {
        ...(dados.id ? { id: dados.id } : {}),
        email: dados.email,
        nome: dados.nome,
        papel: dados.papel,
        empresaId: dados.empresaId ?? null,
        unidadeId: dados.unidadeId ?? null,
        areaId: dados.areaId ?? null,
        funcaoId: dados.funcaoId ?? null,
        senhaHash: dados.senhaHash ?? null,
        mustResetPassword: dados.mustResetPassword ?? false,
      },
    });
  },

  /** Busca perfil completo pelo ID */
  async obterPorId(uid: string) {
    return prisma.usuario.findUnique({
      where: { id: uid },
      include: {
        empresa: { select: { id: true, nome: true, status: true } },
        unidade: { select: { id: true, nome: true } },
        area: { select: { id: true, nome: true } },
        funcao: { select: { id: true, nome: true } },
      },
    });
  },

  /** Busca usuário pelo e-mail (dados básicos, sem senha) */
  async obterPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
    });
  },

  /**
   * Busca usuário pelo e-mail com todos os dados necessários para login.
   * Inclui senhaHash e relações de empresa/unidade.
   */
  async obterPorEmailCompleto(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      include: {
        empresa: { select: { id: true, nome: true, status: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });
  },

  /** Lista todos os usuários de uma empresa */
  async listarPorEmpresa(empresaId: string) {
    return prisma.usuario.findMany({
      where: { empresaId },
      include: {
        unidade: { select: { id: true, nome: true } },
        area: { select: { id: true, nome: true } },
        funcao: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: "desc" },
    });
  },

  /** Lista todos os usuários de uma unidade específica */
  async listarPorUnidade(unidadeId: string) {
    return prisma.usuario.findMany({
      where: { unidadeId },
      orderBy: { nome: "asc" },
    });
  },

  /** Atualiza dados de um usuário */
  async atualizar(uid: string, dados: DadosAtualizarUsuario) {
    return prisma.usuario.update({
      where: { id: uid },
      data: dados,
    });
  },

  /** Inativa um usuário (soft delete) */
  async inativar(uid: string) {
    return prisma.usuario.update({
      where: { id: uid },
      data: { status: "inativo" },
    });
  },

  /** Reativa um usuário */
  async reativar(uid: string) {
    return prisma.usuario.update({
      where: { id: uid },
      data: { status: "ativo" },
    });
  },

  /** Registra o último acesso */
  async registrarUltimoAcesso(uid: string) {
    return prisma.usuario.update({
      where: { id: uid },
      data: { ultimoAcessoEm: new Date() },
    });
  },

  /** Atualiza a senha hash de um usuário */
  async atualizarSenha(uid: string, senhaHash: string) {
    return prisma.usuario.update({
      where: { id: uid },
      data: { senhaHash, mustResetPassword: false },
    });
  },

  /** Conta total de usuários do sistema (saasAdmin) */
  async contarAdminsSistema() {
    return prisma.usuario.count({
      where: { papel: "saasAdmin" },
    });
  },
};
