/**
 * Hook usePerfil — Restaurante360
 *
 * Busca o perfil completo do usuário autenticado via API (/api/auth/perfil),
 * que por sua vez lê do PostgreSQL via cookie JWT.
 *
 * Fluxo: Cookie JWT → /api/auth/perfil → PostgreSQL → PerfilUsuario
 */
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import type { PerfilUsuario } from '@/lib/tipos/identidade';

export function usePerfil() {
  const { usuarioLogado, carregandoAuth } = useAuth();

  // O perfil já vem do useAuth — não precisa de chamada separada
  return {
    perfilUsuario: usuarioLogado,
    carregandoPerfil: carregandoAuth,
    erroPerfil: null as Error | null,
  };
}
