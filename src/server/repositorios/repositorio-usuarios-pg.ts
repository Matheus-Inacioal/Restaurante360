/**
 * Repositório de Usuários — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { PapelUsuario, StatusAtivo, NivelHierarquia } from "@/lib/tipos/identidade";

// ─── Tipos de entrada ─────────────────────────────────────────

export interface DadosCriarUsuario {
  id?: string;          // Opcional — se não informado, o Prisma gera via cuid()
  email: string;
  nome: string;
  papel: PapelUsuario;
  nivelHierarquia?: NivelHierarquia | null;
  empresaId?: string;
  unidadeId?: string;
  areaId?: string;
  funcaoId?: string;
  perfilAcessoId?: string | null;
  cargoId?: string | null;
  senhaHash?: string;
  mustResetPassword?: boolean;
}

export interface DadosAtualizarUsuario {
  nome?: string;
  papel?: PapelUsuario;
  nivelHierarquia?: NivelHierarquia | null;
  unidadeId?: string | null;
  areaId?: string | null;
  funcaoId?: string | null;
  perfilAcessoId?: string | null;
  cargoId?: string | null;
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
        nivelHierarquia: dados.nivelHierarquia ?? null,
        empresaId: dados.empresaId ?? null,
        unidadeId: dados.unidadeId ?? null,
        areaId: dados.areaId ?? null,
        funcaoId: dados.funcaoId ?? null,
        perfilAcessoId: dados.perfilAcessoId ?? null,
        cargoId: dados.cargoId ?? null,
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
        perfilAcesso: { select: { id: true, nome: true, nivel: true } },
        cargo: { select: { id: true, nome: true } },
        unidadesVinculadas: { include: { unidade: { select: { id: true, nome: true } } } },
      },
    });
  },

  /** Busca usuário pelo e-mail (dados básicos, sem senha) */
  async obterPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
      include: {
        perfilAcesso: { select: { id: true, nome: true, nivel: true } },
        cargo: { select: { id: true, nome: true } },
        unidadesVinculadas: true
      }
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
        perfilAcesso: { select: { id: true, nome: true, nivel: true } },
        cargo: { select: { id: true, nome: true } },
        unidadesVinculadas: true
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
        perfilAcesso: { select: { id: true, nome: true, nivel: true } },
        cargo: { select: { id: true, nome: true } },
        unidadesVinculadas: { include: { unidade: { select: { id: true, nome: true } } } }
      },
      orderBy: { criadoEm: "desc" },
    });
  },

  /** Lista todos os usuários de uma unidade específica (direta ou indiretamente) */
  async listarPorUnidade(unidadeId: string) {
    return prisma.usuario.findMany({
      where: {
        OR: [
          { unidadeId },
          { unidadesVinculadas: { some: { unidadeId } } }
        ]
      },
      include: {
        perfilAcesso: { select: { id: true, nome: true, nivel: true } },
        cargo: { select: { id: true, nome: true } },
        unidadesVinculadas: { include: { unidade: { select: { id: true, nome: true } } } }
      },
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

  /** Atualiza os vínculos do usuário na tabela UsuarioUnidade */
  async vincularUnidades(usuarioId: string, unidadeIds: string[]) {
    // Usar uma transação para deletar vínculos antigos e criar novos
    return prisma.$transaction(async (tx) => {
      await tx.usuarioUnidade.deleteMany({
        where: { usuarioId }
      });

      if (unidadeIds.length > 0) {
        await tx.usuarioUnidade.createMany({
          data: unidadeIds.map((unidadeId) => ({
            usuarioId,
            unidadeId
          }))
        });
      }
    });
  },

  /** Lista todos os cargos cadastrados na empresa */
  async listarCargosPorEmpresa(empresaId: string) {
    return prisma.cargo.findMany({
      where: { empresaId, status: "ativo" },
      orderBy: { nome: "asc" }
    });
  },

  /** Cria ou atualiza um cargo na empresa */
  async criarCargo(empresaId: string, nome: string, descricao?: string | null) {
    return prisma.cargo.create({
      data: {
        empresaId,
        nome,
        descricao,
        status: "ativo"
      }
    });
  }
};
