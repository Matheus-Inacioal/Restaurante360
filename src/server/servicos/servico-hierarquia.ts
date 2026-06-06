/**
 * Serviço de Hierarquia — Restaurante360
 * Acesso exclusivo do servidor (server-only)
 */
import "server-only";
import type { NivelHierarquia } from "@/lib/tipos/identidade";

// Definição do peso numérico de cada nível de hierarquia
const PESO_HIERARQUIA: Record<NivelHierarquia, number> = {
  MASTER_LOJA: 5,
  ADMINISTRADOR: 4,
  ADMINISTRATIVO: 3,
  GESTOR_LOCAL: 2,
  COLABORADOR: 1
};

export const servicoHierarquia = {

  /**
   * Retorna o peso numérico do nível de hierarquia.
   * Útil para comparações matemáticas de superioridade.
   */
  obterPeso(nivel: NivelHierarquia | null | undefined): number {
    if (!nivel) return 0;
    return PESO_HIERARQUIA[nivel] || 0;
  },

  /**
   * Valida se um autor pode realizar uma ação sobre um alvo baseado em seus níveis de hierarquia.
   * Regra principal: Um usuário não pode criar ou gerenciar outro com nível superior ao seu.
   * 
   * @param autorNivel Nível do usuário que realiza a ação
   * @param alvoNivel Nível do usuário que recebe a ação
   * @throws Error se a ação for proibida por hierarquia
   */
  validarAcaoHierarquia(
    autorNivel: NivelHierarquia | null | undefined,
    alvoNivel: NivelHierarquia | null | undefined
  ): void {
    const pesoAutor = this.obterPeso(autorNivel);
    const pesoAlvo = this.obterPeso(alvoNivel);

    // Se o autor é o Master, ele tem controle total
    if (autorNivel === "MASTER_LOJA") {
      return;
    }

    // Colaboradores comuns nunca podem fazer ações de gerenciamento/criação
    if (autorNivel === "COLABORADOR" || pesoAutor === 0) {
      throw new Error("Acesso negado: colaboradores não têm permissão de gerenciamento.");
    }

    // Regra: Não pode criar/gerenciar usuário com nível superior ao seu
    if (pesoAlvo > pesoAutor) {
      throw new Error(`Acesso negado: seu nível (${autorNivel}) é inferior ao nível alvo (${alvoNivel}).`);
    }
  },

  /**
   * Verifica se o autor pode conceder ou gerenciar um determinado nível.
   */
  podeGerenciarNivel(
    autorNivel: NivelHierarquia | null | undefined,
    alvoNivel: NivelHierarquia | null | undefined
  ): boolean {
    try {
      this.validarAcaoHierarquia(autorNivel, alvoNivel);
      return true;
    } catch {
      return false;
    }
  }
};
