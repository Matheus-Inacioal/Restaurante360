/**
 * Serviço de Auditoria de Permissões — Restaurante360
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { repositorioAuditoriaPermissoesPg } from "@/server/repositorios/repositorio-auditoria-permissoes-pg";
import type { ModuloPermissao } from "@/lib/tipos/identidade";

export const servicoAuditoriaPermissoes = {

  /**
   * Registra a auditoria de uma concessão de permissão customizada.
   */
  async registrarConcessao(
    empresaId: string,
    usuarioId: string,
    autorId: string,
    modulo: ModuloPermissao,
    permissao: string,
    antes: string | null = null,
    depois: string = "CONCEDIDA"
  ) {
    return repositorioAuditoriaPermissoesPg.registrarAuditoria({
      empresaId,
      usuarioId,
      autorId,
      modulo,
      permissao,
      acao: "CONCEDIDA",
      antes,
      depois
    });
  },

  /**
   * Registra a auditoria de uma revogação de permissão.
   */
  async registrarRevogacao(
    empresaId: string,
    usuarioId: string,
    autorId: string,
    modulo: ModuloPermissao,
    permissao: string,
    antes: string = "CONCEDIDA",
    depois: string = "REVOGADA"
  ) {
    return repositorioAuditoriaPermissoesPg.registrarAuditoria({
      empresaId,
      usuarioId,
      autorId,
      modulo,
      permissao,
      acao: "REVOGADA",
      antes,
      depois
    });
  },

  /**
   * Obtém o histórico de auditoria completo da empresa
   */
  async obterHistorico(empresaId: string, usuarioId?: string) {
    if (!empresaId) {
      throw new Error("ID da empresa é obrigatório para consultar auditoria.");
    }
    return repositorioAuditoriaPermissoesPg.obterHistorico(empresaId, usuarioId);
  }
};
