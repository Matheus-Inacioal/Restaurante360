/**
 * Repositório de Permissões — PostgreSQL/Prisma
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import type { NivelHierarquia, ModuloPermissao } from "@/lib/tipos/identidade";

export const repositorioPermissoesPg = {
  
  /** Retorna todas as permissões cadastradas no sistema */
  async listarPermissoesDisponiveis() {
    return prisma.permissao.findMany({
      orderBy: [
        { modulo: "asc" },
        { nome: "asc" }
      ]
    });
  },

  /** 
   * Obtém a lista de permissões efetivas do usuário (Perfil + Customizações)
   * Retorna um array de strings com os nomes das permissões concedidas.
   */
  async obterPermissoesUsuario(usuarioId: string): Promise<string[]> {
    // 1. Obter o usuário e seu perfil e customizações
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        nivelHierarquia: true,
        perfilAcessoId: true,
        permissoesUsuario: {
          include: {
            permissao: { select: { nome: true } }
          }
        }
      }
    });

    if (!usuario) return [];

    // Se for MASTER_LOJA, ele tem acesso irrestrito.
    // Retornamos todas as permissões do sistema.
    if (usuario.nivelHierarquia === "MASTER_LOJA") {
      const todas = await prisma.permissao.findMany({ select: { nome: true } });
      return todas.map(p => p.nome);
    }

    const mapaPermissoes = new Map<string, boolean>();

    // 2. Carregar permissões do Perfil de Acesso se houver
    if (usuario.perfilAcessoId) {
      const perfilPerms = await prisma.permissaoPerfil.findMany({
        where: { perfilId: usuario.perfilAcessoId },
        include: {
          permissao: { select: { nome: true } }
        }
      });

      for (const pp of perfilPerms) {
        mapaPermissoes.set(pp.permissao.nome, true);
      }
    }

    // 3. Sobrepor com as permissões customizadas do Usuário
    for (const pu of usuario.permissoesUsuario) {
      mapaPermissoes.set(pu.permissao.nome, pu.concedido);
    }

    // 4. Filtrar apenas as que estão ativas/concedidas (true)
    const efetivas: string[] = [];
    mapaPermissoes.forEach((concedido, nomePermissao) => {
      if (concedido) {
        efetivas.push(nomePermissao);
      }
    });

    return efetivas;
  },

  /**
   * Salva as permissões customizadas de um usuário em uma transação do Prisma.
   */
  async salvarPermissoesUsuario(
    usuarioId: string,
    permissoes: { permissaoId: string; concedido: boolean }[]
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Limpar permissões customizadas anteriores
      await tx.permissaoUsuario.deleteMany({
        where: { usuarioId }
      });

      // 2. Inserir novas customizações se houver
      if (permissoes.length > 0) {
        await tx.permissaoUsuario.createMany({
          data: permissoes.map(p => ({
            usuarioId,
            permissaoId: p.permissaoId,
            concedido: p.concedido
          }))
        });
      }
    });
  },

  /**
   * Lista todos os perfis de acesso cadastrados na empresa
   */
  async listarPerfis(empresaId: string) {
    return prisma.perfilAcesso.findMany({
      where: { empresaId },
      include: {
        permissoesPerfil: {
          include: { permissao: true }
        }
      },
      orderBy: { nome: "asc" }
    });
  },

  /**
   * Busca um perfil de acesso pelo ID
   */
  async obterPerfilPorId(perfilId: string) {
    return prisma.perfilAcesso.findUnique({
      where: { id: perfilId },
      include: {
        permissoesPerfil: {
          include: { permissao: true }
        }
      }
    });
  },

  /**
   * Cria um perfil de acesso
   */
  async criarPerfilAcesso(dados: {
    empresaId: string;
    nome: string;
    descricao?: string | null;
    nivel: NivelHierarquia;
  }) {
    return prisma.perfilAcesso.create({
      data: {
        empresaId: dados.empresaId,
        nome: dados.nome,
        descricao: dados.descricao,
        nivel: dados.nivel
      }
    });
  },

  /**
   * Vincula permissões a um perfil de acesso (deleta antigos e cria novos)
   */
  async vincularPermissoesAoPerfil(perfilId: string, permissaoIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.permissaoPerfil.deleteMany({
        where: { perfilId }
      });

      if (permissaoIds.length > 0) {
        await tx.permissaoPerfil.createMany({
          data: permissaoIds.map(permissaoId => ({
            perfilId,
            permissaoId
          }))
        });
      }
    });
  }
};
