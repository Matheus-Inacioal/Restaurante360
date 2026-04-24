/**
 * Hook useAuth — Restaurante360
 *
 * Gerencia estado de autenticação do usuário.
 * Autenticação é feita via API (PostgreSQL + bcrypt + JWT em cookie httpOnly).
 * Sem dependência do Firebase.
 *
 * Fluxo:
 * - Login: POST /api/auth/login → recebe perfil + cookie sessão
 * - Logout: POST /api/auth/logout → limpa cookie
 * - Verificação: GET /api/auth/perfil → valida cookie existente
 */
import { useState, useEffect, useCallback } from "react";
import type { PerfilUsuario } from "@/lib/tipos/identidade";

interface EstadoAuth {
  usuarioLogado: PerfilUsuario | null;
  carregandoAuth: boolean;
  erroAuth: Error | null;
}

export function useAuth() {
  const [estado, setEstado] = useState<EstadoAuth>({
    usuarioLogado: null,
    carregandoAuth: true,
    erroAuth: null,
  });

  // Verificar sessão existente no mount
  useEffect(() => {
    let cancelado = false;

    async function verificarSessao() {
      try {
        const res = await fetch("/api/auth/perfil", { credentials: "same-origin" });

        if (!res.ok) {
          if (!cancelado) {
            setEstado({ usuarioLogado: null, carregandoAuth: false, erroAuth: null });
          }
          return;
        }

        const json = await res.json();
        if (json.ok && json.data && !cancelado) {
          setEstado({ usuarioLogado: json.data, carregandoAuth: false, erroAuth: null });
        } else if (!cancelado) {
          setEstado({ usuarioLogado: null, carregandoAuth: false, erroAuth: null });
        }
      } catch (error: any) {
        if (!cancelado) {
          setEstado({ usuarioLogado: null, carregandoAuth: false, erroAuth: error });
        }
      }
    }

    verificarSessao();
    return () => { cancelado = true; };
  }, []);

  /**
   * Faz login com e-mail e senha via API.
   */
  const entrarComEmailSenha = useCallback(
    async (
      email: string,
      senha: string
    ): Promise<{ ok: true; perfil: PerfilUsuario } | { ok: false; code?: string; message: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
          credentials: "same-origin",
        });

        const json = await res.json();

        if (!json.ok) {
          return { ok: false, code: json.code, message: json.message || "Falha no login." };
        }

        const perfil = json.data as PerfilUsuario;
        setEstado({ usuarioLogado: perfil, carregandoAuth: false, erroAuth: null });
        return { ok: true, perfil };
      } catch (error: any) {
        return { ok: false, message: error.message || "Erro de rede ao tentar logar." };
      }
    },
    []
  );

  /**
   * Faz logout limpando o cookie de sessão.
   */
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    } finally {
      setEstado({ usuarioLogado: null, carregandoAuth: false, erroAuth: null });
    }
  }, []);

  return {
    usuarioLogado: estado.usuarioLogado,
    // Compatibilidade com código existente que espera `usuarioAuth`
    usuarioAuth: estado.usuarioLogado,
    carregandoAuth: estado.carregandoAuth,
    erroAuth: estado.erroAuth,
    entrarComEmailSenha,
    logout,
  };
}
