/**
 * Sistema de permissões do Restaurante360
 * Baseado nos 4 perfis de acesso
 */
import type { PapelUsuario, PerfilUsuario } from './tipos/identidade';

// ─── Portais disponíveis ──────────────────────────────────────

export type PortalSistema = 'sistema' | 'empresa' | 'unidade' | 'operacional';

/**
 * Mapeamento de perfil → portal principal
 */
export const PORTAL_POR_PAPEL: Record<PapelUsuario, PortalSistema> = {
  saasAdmin: 'sistema',
  gestorCorporativo: 'empresa',
  gestorLocal: 'unidade',
  operacional: 'operacional',
};

// ─── Verificações de acesso por portal ───────────────────────

/**
 * Verifica se o usuário pode acessar o portal solicitado
 */
export function podeAcessarPortal(
  perfil: PerfilUsuario | null | undefined,
  portal: PortalSistema
): boolean {
  if (!perfil || perfil.status !== 'ativo') return false;

  switch (portal) {
    case 'sistema':
      return perfil.papel === 'saasAdmin';

    case 'empresa':
      return (
        perfil.papel === 'gestorCorporativo' &&
        !!perfil.empresaId
      );

    case 'unidade':
      return (
        perfil.papel === 'gestorLocal' &&
        !!perfil.empresaId &&
        !!perfil.unidadeId
      );

    case 'operacional':
      return (
        perfil.papel === 'operacional' &&
        !!perfil.empresaId
      );

    default:
      return false;
  }
}

// ─── Capacidades por papel ────────────────────────────────────

export const CAPACIDADES = {
  /** Pode gerenciar empresas e usuários do SaaS */
  podeGerenciarEmpresas: (papel: PapelUsuario) => papel === 'saasAdmin',

  /** Pode criar unidades */
  podeCriarUnidades: (papel: PapelUsuario) =>
    papel === 'saasAdmin' || papel === 'gestorCorporativo',

  /** Pode criar áreas e funções */
  podeCriarAreasFuncoes: (papel: PapelUsuario) =>
    papel === 'saasAdmin' || papel === 'gestorCorporativo',

  /** Pode gerenciar usuários da empresa */
  podeGerenciarUsuariosEmpresa: (papel: PapelUsuario) =>
    papel === 'gestorCorporativo' || papel === 'gestorLocal',

  /** Pode criar tarefas e rotinas */
  podeCriarTarefas: (papel: PapelUsuario) =>
    papel !== 'saasAdmin' && papel !== 'operacional',

  /** Pode executar tarefas (marcar como concluída, etc.) */
  podeExecutarTarefas: (papel: PapelUsuario) =>
    papel === 'operacional' || papel === 'gestorLocal',

  /** Pode ver relatórios consolidados */
  podeVerRelatorios: (papel: PapelUsuario) =>
    papel === 'saasAdmin' ||
    papel === 'gestorCorporativo' ||
    papel === 'gestorLocal',
} as const;
