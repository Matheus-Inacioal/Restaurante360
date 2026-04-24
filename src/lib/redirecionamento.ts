/**
 * Lógica de redirecionamento por perfil — Restaurante360
 * Determina a rota inicial após login com base no papel do usuário
 */
import type { PerfilUsuario } from './tipos/identidade';

/**
 * Calcula a rota inicial após login com base no perfil do usuário.
 */
export function calcularRotaInicial(perfil: PerfilUsuario): string {
  if (!perfil || perfil.status !== 'ativo') {
    return '/acesso-negado';
  }

  switch (perfil.papel) {
    case 'saasAdmin':
      return '/sistema';

    case 'gestorCorporativo':
      return '/empresa';

    case 'gestorLocal':
      return '/unidade';

    case 'operacional':
      return '/operacional';

    default:
      return '/acesso-negado';
  }
}

/**
 * Retorna o label do portal para exibição na UI
 */
export function labelPortal(papel: PerfilUsuario['papel']): string {
  const labels: Record<PerfilUsuario['papel'], string> = {
    saasAdmin: 'Painel SaaS',
    gestorCorporativo: 'Painel da Empresa',
    gestorLocal: 'Painel da Unidade',
    operacional: 'Portal Operacional',
  };
  return labels[papel] ?? 'Portal';
}
