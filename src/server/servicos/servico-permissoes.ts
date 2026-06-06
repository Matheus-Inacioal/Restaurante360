/**
 * Serviço de Permissões — Restaurante360
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import { repositorioPermissoesPg } from "@/server/repositorios/repositorio-permissoes-pg";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { servicoHierarquia } from "./servico-hierarquia";
import { servicoAuditoriaPermissoes } from "./servico-auditoria-permissoes";
import type { ModuloPermissao } from "@/lib/tipos/identidade";

export const servicoPermissoes = {

  /**
   * Verifica se o usuário possui a permissão requerida de forma ativa.
   * O Master da loja (nivelHierarquia === MASTER_LOJA) sempre tem acesso total.
   */
  async verificarPermissao(usuarioId: string, permissaoRequerida: string): Promise<boolean> {
    if (!usuarioId) return false;

    // Busca as permissões efetivas do usuário (contempla Master automaticamente)
    const permissoesEfetivas = await repositorioPermissoesPg.obterPermissoesUsuario(usuarioId);
    
    return permissoesEfetivas.includes(permissaoRequerida);
  },

  /**
   * Atualiza as permissões customizadas de um usuário com validações estritas de segurança.
   * 
   * @param autorId Usuário que está fazendo a alteração
   * @param usuarioAlvoId Usuário que receberá as alterações
   * @param permissoesDesejadas Array de permissões e se estão ativas
   */
  async atualizarPermissoesUsuario(
    autorId: string,
    usuarioAlvoId: string,
    permissoesDesejadas: { permissaoId: string; concedido: boolean }[]
  ) {
    // 1. Obter autor e alvo
    const autor = await repositorioUsuariosPg.obterPorId(autorId);
    const alvo = await repositorioUsuariosPg.obterPorId(usuarioAlvoId);

    if (!autor) throw new Error("Usuário autor não encontrado.");
    if (!alvo) throw new Error("Usuário alvo não encontrado.");

    // 2. Validar isolamento (Tenant)
    if (autor.empresaId !== alvo.empresaId) {
      throw new Error("Acesso negado: os usuários pertencem a empresas distintas.");
    }

    // 3. Validar hierarquia
    servicoHierarquia.validarAcaoHierarquia(autor.nivelHierarquia, alvo.nivelHierarquia);

    // 4. Validar se o autor tem permissão de gerenciar permissões
    // O Master não precisa dessa checagem
    if (autor.nivelHierarquia !== "MASTER_LOJA") {
      const temPermissaoGerir = await this.verificarPermissao(autorId, "usuarios:alterar_permissoes");
      if (!temPermissaoGerir) {
        throw new Error("Acesso negado: você não tem permissão para alterar permissões de usuários.");
      }
    }

    // 5. Validar alçada máxima: O autor não pode conceder permissões que ele mesmo não possui!
    // (Ignorado para Master da loja)
    const todasPermissoes = await repositorioPermissoesPg.listarPermissoesDisponiveis();
    const permissoesAutor = await repositorioPermissoesPg.obterPermissoesUsuario(autorId);

    if (autor.nivelHierarquia !== "MASTER_LOJA") {
      for (const desejada of permissoesDesejadas) {
        // Encontra o nome da permissão pelo ID
        const permObj = todasPermissoes.find(p => p.id === desejada.permissaoId);
        if (!permObj) continue;

        // Se o autor está tentando conceder uma permissão que ele não tem, lança erro
        if (desejada.concedido && !permissoesAutor.includes(permObj.nome)) {
          throw new Error(`Acesso negado: você não pode conceder a permissão '${permObj.nome}' pois você mesmo não a possui.`);
        }
      }
    }

    // 6. Carregar estado anterior de customizações para auditoria
    const alvoAnterior = await repositorioUsuariosPg.obterPorId(usuarioAlvoId);
    const customizacoesAnteriores = alvoAnterior?.permissoesUsuario || [];

    // 7. Salvar as novas permissões
    await repositorioPermissoesPg.salvarPermissoesUsuario(usuarioAlvoId, permissoesDesejadas);

    // 8. Comparar e registrar auditorias detalhadas
    for (const desejada of permissoesDesejadas) {
      const permObj = todasPermissoes.find(p => p.id === desejada.permissaoId);
      if (!permObj) continue;

      const antesObj = customizacoesAnteriores.find(c => c.permissaoId === desejada.permissaoId);
      const estadoAntes = antesObj ? (antesObj.concedido ? "CONCEDIDA" : "REVOGADA") : "SEM_CUSTOMIZACAO";
      const estadoDepois = desejada.concedido ? "CONCEDIDA" : "REVOGADA";

      // Só audita se mudou de fato
      if (estadoAntes !== estadoDepois) {
        if (desejada.concedido) {
          await servicoAuditoriaPermissoes.registrarConcessao(
            autor.empresaId!,
            usuarioAlvoId,
            autorId,
            permObj.modulo as ModuloPermissao,
            permObj.nome,
            antesObj ? "REVOGADA" : null,
            "CONCEDIDA"
          );
        } else {
          await servicoAuditoriaPermissoes.registrarRevogacao(
            autor.empresaId!,
            usuarioAlvoId,
            autorId,
            permObj.modulo as ModuloPermissao,
            permObj.nome,
            antesObj && antesObj.concedido ? "CONCEDIDA" : "SEM_CUSTOMIZACAO",
            "REVOGADA"
          );
        }
      }
    }

    return { sucesso: true };
  },

  /** Retorna todas as permissões cadastradas no sistema agrupadas por módulo */
  async obterCatalogoPermissoes() {
    return repositorioPermissoesPg.listarPermissoesDisponiveis();
  },

  /**
   * Retorna os perfis de acesso cadastrados para a empresa
   */
  async listarPerfis(empresaId: string) {
    if (!empresaId) throw new Error("ID da empresa é obrigatório.");
    return repositorioPermissoesPg.listarPerfis(empresaId);
  }
};
