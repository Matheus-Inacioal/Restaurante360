/**
 * Hook usePerfil — Restaurante360
 *
 * Busca o perfil completo do usuário autenticado via API (/api/auth/perfil),
 * que por sua vez lê do PostgreSQL.
 *
 * Fluxo: Firebase Auth → ID Token → /api/auth/perfil → PostgreSQL → PerfilUsuario
 */
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { fetchJSON } from '@/lib/http/fetch-json';
import type { PerfilUsuario } from '@/lib/tipos/identidade';

export function usePerfil() {
  const { usuarioAuth, carregandoAuth } = useAuth();
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [erroPerfil, setErroPerfil] = useState<Error | null>(null);

  useEffect(() => {
    if (carregandoAuth) return;

    if (!usuarioAuth) {
      setPerfilUsuario(null);
      setCarregandoPerfil(false);
      return;
    }

    setCarregandoPerfil(true);
    setErroPerfil(null);

    fetchJSON<PerfilUsuario>('/api/auth/perfil')
      .then((res) => {
        if (!res.ok) {
          const mensagem = 'message' in res ? res.message : 'Perfil não encontrado.';
          // Código especial para perfil não provisionado
          if ('code' in res && res.code === 'NOT_FOUND') {
            setErroPerfil(new Error('PERFIL_NAO_PROVISIONADO'));
          } else {
            setErroPerfil(new Error(mensagem));
          }
          setPerfilUsuario(null);
        } else {
          setPerfilUsuario(res.data);
        }
      })
      .catch((error: Error) => {
        setErroPerfil(error);
        setPerfilUsuario(null);
      })
      .finally(() => {
        setCarregandoPerfil(false);
      });
  }, [usuarioAuth, carregandoAuth]);

  return {
    perfilUsuario,
    carregandoPerfil: carregandoAuth || carregandoPerfil,
    erroPerfil,
  };
}
