/**
 * Hook usePermissoes — Restaurante360
 * use-client safe
 * 
 * Permite checar de forma síncrona e rápida se o usuário logado possui
 * uma determinada permissão para renderização de recursos visuais na UI.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { usePerfil } from "./use-perfil";
import { repositorioPermissoes } from "@/lib/repositories/repositorio-permissoes";

// Cache simples em memória para evitar fetches excessivos ao navegar entre rotas
let cachePermissoes: string[] | null = null;
let cacheUsuarioId: string | null = null;

export function usePermissoes() {
  const { perfilUsuario, carregandoPerfil } = usePerfil();
  const [permissoes, setPermissoes] = useState<string[]>(cachePermissoes || []);
  const [carregando, setCarregando] = useState(cachePermissoes === null);

  useEffect(() => {
    if (carregandoPerfil || !perfilUsuario) return;

    // Se o usuário mudou, invalida o cache
    if (cacheUsuarioId !== perfilUsuario.id) {
      cachePermissoes = null;
      cacheUsuarioId = perfilUsuario.id;
    }

    if (cachePermissoes !== null) {
      setPermissoes(cachePermissoes);
      setCarregando(false);
      return;
    }

    let ativo = true;

    async function carregarMinhasPermissoes() {
      try {
        setCarregando(true);
        // O Master da loja tem acesso irrestrito, a API retornará todas as permissões
        const matriz = await repositorioPermissoes.obterPermissoesUsuario(perfilUsuario!.id);
        const concedidas = matriz.filter(p => p.concedida).map(p => p.nome);

        if (ativo) {
          cachePermissoes = concedidas;
          setPermissoes(concedidas);
          setCarregando(false);
        }
      } catch (err) {
        console.error("Erro ao carregar permissões do usuário logado:", err);
        if (ativo) setCarregando(false);
      }
    }

    carregarMinhasPermissoes();

    return () => {
      ativo = false;
    };
  }, [perfilUsuario, carregandoPerfil]);

  /**
   * Retorna se o usuário possui a permissão especificada.
   * Regra: Master da Loja sempre possui qualquer permissão.
   */
  const pode = useCallback(
    (permissaoRequerida: string): boolean => {
      if (!perfilUsuario) return false;
      
      // Regra Master: Acesso total
      if (perfilUsuario.nivelHierarquia === "MASTER_LOJA") {
        return true;
      }

      // saasAdmin também tem passe livre nas checagens corporativas
      if (perfilUsuario.papel === "saasAdmin") {
        return true;
      }

      return permissoes.includes(permissaoRequerida);
    },
    [perfilUsuario, permissoes]
  );

  return {
    permissoes,
    carregando: carregando || carregandoPerfil,
    pode,
    nivel: perfilUsuario?.nivelHierarquia || null,
    papel: perfilUsuario?.papel || null
  };
}
