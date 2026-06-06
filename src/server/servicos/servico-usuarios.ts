/**
 * Serviço de Usuários — Restaurante360
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { servicoHierarquia } from "./servico-hierarquia";
import { servicoPermissoes } from "./servico-permissoes";
import type { NivelHierarquia, StatusAtivo, PapelUsuario } from "@/lib/tipos/identidade";
import bcrypt from "bcryptjs";

export interface PayloadCriarUsuario {
  email: string;
  nome: string;
  papel: PapelUsuario;
  nivelHierarquia: NivelHierarquia;
  unidadeId?: string | null;
  areaId?: string | null;
  funcaoId?: string | null;
  perfilAcessoId?: string | null;
  cargoId?: string | null;
  unidadeIds?: string[]; // Várias unidades vinculadas
}

export interface PayloadAtualizarUsuario {
  nome?: string;
  papel?: PapelUsuario;
  nivelHierarquia?: NivelHierarquia;
  unidadeId?: string | null;
  areaId?: string | null;
  funcaoId?: string | null;
  perfilAcessoId?: string | null;
  cargoId?: string | null;
  status?: StatusAtivo;
  unidadeIds?: string[];
}

export const servicoUsuarios = {

  /**
   * Cria um novo usuário na empresa garantindo isolamento e validação de privilégios.
   */
  async criarUsuario(autorId: string, dados: PayloadCriarUsuario) {
    const autor = await repositorioUsuariosPg.obterPorId(autorId);
    if (!autor) throw new Error("Usuário autor não encontrado.");

    // 1. Validar se o autor tem permissão de gerenciar usuários
    if (autor.nivelHierarquia !== "MASTER_LOJA") {
      const temPermissao = await servicoPermissoes.verificarPermissao(autorId, "usuarios:criar");

      if (!temPermissao && autor.papel !== "gestorCorporativo") {
        throw new Error("Acesso negado: você não tem permissão para criar usuários.");
      }
    }

    // 2. Validar hierarquia: O autor não pode criar um usuário de nível superior ao seu
    servicoHierarquia.validarAcaoHierarquia(autor.nivelHierarquia, dados.nivelHierarquia);

    // 3. Verificar duplicidade de e-mail
    const emailExistente = await repositorioUsuariosPg.obterPorEmail(dados.email);
    if (emailExistente) {
      throw new Error("Um usuário com este e-mail já está cadastrado.");
    }

    // 4. Criptografar senha temporária padrão (Senha@123!)
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash("Senha@123!", salt);

    // 5. Salvar usuário no banco
    const novoUsuario = await repositorioUsuariosPg.criar({
      email: dados.email,
      nome: dados.nome,
      papel: dados.papel,
      nivelHierarquia: dados.nivelHierarquia,
      empresaId: autor.empresaId!,
      unidadeId: dados.unidadeId ?? null,
      areaId: dados.areaId ?? null,
      funcaoId: dados.funcaoId ?? null,
      perfilAcessoId: dados.perfilAcessoId ?? null,
      cargoId: dados.cargoId ?? null,
      senhaHash,
      mustResetPassword: true, // Força redefinição de senha no primeiro login
    });

    // 6. Criar os vínculos de unidades na tabela UsuarioUnidade
    const unidadesParaVincular = dados.unidadeIds || [];
    // Garante que se informou unidadeId principal, ela está na lista
    if (dados.unidadeId && !unidadesParaVincular.includes(dados.unidadeId)) {
      unidadesParaVincular.push(dados.unidadeId);
    }

    if (unidadesParaVincular.length > 0) {
      await repositorioUsuariosPg.vincularUnidades(novoUsuario.id, unidadesParaVincular);
    }

    return novoUsuario;
  },

  /**
   * Atualiza dados de um usuário na empresa sob regras estritas de hierarquia.
   */
  async atualizarUsuario(autorId: string, usuarioAlvoId: string, dados: PayloadAtualizarUsuario) {
    const autor = await repositorioUsuariosPg.obterPorId(autorId);
    const alvo = await repositorioUsuariosPg.obterPorId(usuarioAlvoId);

    if (!autor) throw new Error("Usuário autor não encontrado.");
    if (!alvo) throw new Error("Usuário alvo não encontrado.");

    // 1. Validar se pertencem à mesma empresa (Tenant)
    if (autor.empresaId !== alvo.empresaId) {
      throw new Error("Acesso negado: os usuários pertencem a empresas distintas.");
    }

    // 2. Validar hierarquia do alvo ANTES da alteração
    servicoHierarquia.validarAcaoHierarquia(autor.nivelHierarquia, alvo.nivelHierarquia);

    // 3. Se estiver alterando o nível hierárquico, validar o NOVO nível
    if (dados.nivelHierarquia) {
      servicoHierarquia.validarAcaoHierarquia(autor.nivelHierarquia, dados.nivelHierarquia);
    }

    // 4. Atualizar no banco
    const usuarioAtualizado = await repositorioUsuariosPg.atualizar(usuarioAlvoId, {
      nome: dados.nome,
      papel: dados.papel,
      nivelHierarquia: dados.nivelHierarquia,
      unidadeId: dados.unidadeId,
      areaId: dados.areaId,
      funcaoId: dados.funcaoId,
      perfilAcessoId: dados.perfilAcessoId,
      cargoId: dados.cargoId,
      status: dados.status,
    });

    // 5. Atualizar os vínculos de unidades na tabela UsuarioUnidade
    if (dados.unidadeIds) {
      const unidadesParaVincular = [...dados.unidadeIds];
      if (dados.unidadeId && !unidadesParaVincular.includes(dados.unidadeId)) {
        unidadesParaVincular.push(dados.unidadeId);
      }
      await repositorioUsuariosPg.vincularUnidades(usuarioAlvoId, unidadesParaVincular);
    }

    return usuarioAtualizado;
  },

  /**
   * Inativa um usuário de forma lógica (desativação).
   */
  async desativarUsuario(autorId: string, usuarioAlvoId: string) {
    const autor = await repositorioUsuariosPg.obterPorId(autorId);
    const alvo = await repositorioUsuariosPg.obterPorId(usuarioAlvoId);

    if (!autor) throw new Error("Usuário autor não encontrado.");
    if (!alvo) throw new Error("Usuário alvo não encontrado.");

    // 1. Validar Tenant
    if (autor.empresaId !== alvo.empresaId) {
      throw new Error("Acesso negado: os usuários pertencem a empresas distintas.");
    }

    // 2. Validar hierarquia
    servicoHierarquia.validarAcaoHierarquia(autor.nivelHierarquia, alvo.nivelHierarquia);

    // 3. Inativar
    return repositorioUsuariosPg.inativar(usuarioAlvoId);
  },

  /**
   * Lista todos os usuários sob a jurisdição do autor
   * (Gestor Local vê apenas os de sua própria unidade; Master/Admin vê todos da empresa)
   */
  async listarUsuarios(autorId: string) {
    const autor = await repositorioUsuariosPg.obterPorId(autorId);
    if (!autor) throw new Error("Usuário autor não encontrado.");

    if (autor.nivelHierarquia === "GESTOR_LOCAL" && autor.unidadeId) {
      return repositorioUsuariosPg.listarPorUnidade(autor.unidadeId);
    }

    return repositorioUsuariosPg.listarPorEmpresa(autor.empresaId!);
  },

  /**
   * Obtém a lista de cargos da empresa
   */
  async obterCargos(empresaId: string) {
    return repositorioUsuariosPg.listarCargosPorEmpresa(empresaId);
  },

  /**
   * Cria um novo cargo na empresa
   */
  async criarCargo(empresaId: string, nome: string, descricao?: string | null) {
    if (!empresaId) throw new Error("ID da empresa é obrigatório.");
    if (!nome) throw new Error("Nome do cargo é obrigatório.");
    return repositorioUsuariosPg.criarCargo(empresaId, nome, descricao);
  }
};
