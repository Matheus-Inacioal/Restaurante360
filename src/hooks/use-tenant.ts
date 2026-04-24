/**
 * Hook useTenant — Restaurante360
 *
 * Retorna o empresaId e unidadeId do usuário logado com base no perfil do PostgreSQL.
 * Atualizado para os 4 novos papéis.
 */
import { usePerfil } from './use-perfil';

export function useTenant() {
  const { perfilUsuario, carregandoPerfil, erroPerfil } = usePerfil();

  if (carregandoPerfil) {
    return {
      empresaId: null,
      unidadeId: null,
      carregandoTenant: true,
      erroTenant: null,
    };
  }

  if (erroPerfil || !perfilUsuario) {
    return {
      empresaId: null,
      unidadeId: null,
      carregandoTenant: false,
      erroTenant: erroPerfil,
    };
  }

  // saasAdmin não tem empresaId — é esperado
  if (perfilUsuario.papel === 'saasAdmin') {
    return {
      empresaId: null,
      unidadeId: null,
      carregandoTenant: false,
      erroTenant: null,
    };
  }

  // Todos os outros perfis precisam de empresaId
  if (!perfilUsuario.empresaId) {
    return {
      empresaId: null,
      unidadeId: null,
      carregandoTenant: false,
      erroTenant: new Error('Usuário sem vínculo com empresa. Contate o administrador.'),
    };
  }

  return {
    empresaId: perfilUsuario.empresaId,
    unidadeId: perfilUsuario.unidadeId ?? null,
    carregandoTenant: false,
    erroTenant: null,
  };
}
