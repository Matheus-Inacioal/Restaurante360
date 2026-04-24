/**
 * Repositório de Usuários — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { PapelUsuario, StatusAtivo } from "@/lib/tipos/identidade";
import { Prisma } from "@prisma/client";

// ─── Tipos de entrada ─────────────────────────────────────────

export interface DadosCriarUsuario {
  id: string;           // UID do Firebase Auth
  email: string;
  nome: string;
  papel: PapelUsuario;
  empresaId?: string;
  unidadeId?: string;
  areaId?: string;
  funcaoId?: string;
  mustResetPassword?: boolean;
}

export interface DadosAtualizarUsuario {
  nome?: string;
  papel?: PapelUsuario;
  unidadeId?: string | null;
  areaId?: string | null;
  funcaoId?: string | null;
  status?: StatusAtivo;
  mustResetPassword?: boolean;
}

// ─── Repositório ──────────────────────────────────────────────

export const repositorioUsuariosPg = {

  /** Cria um novo usuário vinculado ao Firebase Auth UID */
  async criar(dados: DadosCriarUsuario) {
    return prisma.usuario.create({
      data: {
        id: dados.id,
        email: dados.email,
        nome: dados.nome,
        papel: dados.papel,
        empresaId: dados.empresaId ?? null,
        unidadeId: dados.unidadeId ?? null,
        areaId: dados.areaId ?? null,
        funcaoId: dados.funcaoId ?? null,
        mustResetPassword: dados.mustResetPassword ?? false,
      },
    });
  },

  /** Busca perfil completo pelo UID do Firebase */
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

  /** Busca usuário pelo e-mail */
  async obterPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
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
};
