/**
 * Hook useUsuariosPermissoes — Restaurante360
 * use-client safe
 * 
 * Gerencia a lista de usuários da empresa, criação/edição e as permissões do usuário selecionado.
 * Implementa de forma estrita o padrão de 4 estados UI do projeto: Carregando, Vazio, Erro e Sucesso.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { usePerfil } from "./use-perfil";
import { repositorioPermissoes, ItemMatrizPermissao } from "@/lib/repositories/repositorio-permissoes";
import type { PerfilUsuario, AuditoriaPermissao, Cargo } from "@/lib/tipos/identidade";

export function useUsuariosPermissoes() {
  const { perfilUsuario, carregandoPerfil } = usePerfil();

  // Estados dos usuários
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [vazio, setVazio] = useState(false);

  // Estado do usuário atualmente selecionado para gestão de permissões
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<PerfilUsuario | null>(null);
  const [matrizPermissoes, setMatrizPermissoes] = useState<ItemMatrizPermissao[]>([]);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(false);

  // Auditoria
  const [historicoAuditoria, setHistoricoAuditoria] = useState<AuditoriaPermissao[]>([]);
  const [carregandoAuditoria, setCarregandoAuditoria] = useState(false);

  // Cargos
  const [cargos, setCargos] = useState<Cargo[]>([]);

  /**
   * Carrega a lista de colaboradores e as configurações da empresa.
   */
  const carregarDados = useCallback(async () => {
    if (!perfilUsuario) return;

    try {
      setCarregando(true);
      setErro(null);
      setVazio(false);

      const lista = await repositorioPermissoes.listarUsuarios(perfilUsuario.empresaId || undefined);
      setUsuarios(lista);
      setVazio(lista.length === 0);

      // Carregar cargos da empresa
      const resCargos = await fetch(`/api/sistema/cargos?empresaId=${perfilUsuario.empresaId || ""}`);
      if (resCargos.ok) {
        const json = await resCargos.json();
        if (json.ok) setCargos(json.data);
      }
    } catch (err: any) {
      console.error("Erro ao carregar colaboradores:", err);
      setErro(err.message || "Erro inesperado ao carregar dados.");
    } finally {
      setCarregando(false);
    }
  }, [perfilUsuario]);

  useEffect(() => {
    if (!carregandoPerfil && perfilUsuario) {
      carregarDados();
    }
  }, [perfilUsuario, carregandoPerfil, carregarDados]);

  /**
   * Carrega a matriz de permissões efetivas do colaborador selecionado.
   */
  const selecionarUsuario = useCallback(async (colaborador: PerfilUsuario | null) => {
    setUsuarioSelecionado(colaborador);
    if (!colaborador) {
      setMatrizPermissoes([]);
      return;
    }

    try {
      setCarregandoPermissoes(true);
      const matriz = await repositorioPermissoes.obterPermissoesUsuario(colaborador.id);
      setMatrizPermissoes(matriz);
    } catch (err) {
      console.error("Erro ao carregar permissões do colaborador:", err);
    } finally {
      setCarregandoPermissoes(false);
    }
  }, []);

  /**
   * Salva as permissões customizadas editadas no painel.
   */
  const salvarPermissoes = useCallback(async (usuarioId: string, permissoesEditadas: { permissaoId: string; concedido: boolean }[]) => {
    try {
      setCarregandoPermissoes(true);
      await repositorioPermissoes.salvarPermissoesUsuario(usuarioId, permissoesEditadas);
      
      // Recarrega permissões atualizadas
      if (usuarioSelecionado && usuarioSelecionado.id === usuarioId) {
        const matriz = await repositorioPermissoes.obterPermissoesUsuario(usuarioId);
        setMatrizPermissoes(matriz);
      }
      
      // Recarrega o histórico de auditoria para refletir na tela
      carregarHistorico();
      return { sucesso: true };
    } catch (err: any) {
      console.error("Erro ao salvar permissões:", err);
      throw err;
    } finally {
      setCarregandoPermissoes(false);
    }
  }, [usuarioSelecionado]);

  /**
   * Cria um novo colaborador.
   */
  const adicionarUsuario = useCallback(async (payload: any) => {
    try {
      setCarregando(true);
      await repositorioPermissoes.criarUsuario({
        email: payload.email,
        nome: payload.nome,
        papel: payload.papel,
        nivelHierarquia: payload.nivelHierarquia,
        unidadeId: payload.unidadeId || null,
        cargoId: payload.cargoId || null,
        unidadeIds: payload.unidadeIds || []
      });
      await carregarDados();
    } catch (err: any) {
      console.error("Erro ao adicionar colaborador:", err);
      throw err;
    } finally {
      setCarregando(false);
    }
  }, [carregarDados]);

  /**
   * Edita os dados de um colaborador existente.
   */
  const editarUsuario = useCallback(async (id: string, payload: any) => {
    try {
      setCarregando(true);
      await repositorioPermissoes.atualizarUsuario(id, {
        nome: payload.nome,
        papel: payload.papel,
        nivelHierarquia: payload.nivelHierarquia,
        unidadeId: payload.unidadeId || null,
        cargoId: payload.cargoId || null,
        status: payload.status,
        unidadeIds: payload.unidadeIds || []
      });
      await carregarDados();
      // Atualiza usuário selecionado se for ele mesmo
      if (usuarioSelecionado && usuarioSelecionado.id === id) {
        const atualizado = await repositorioPermissoes.listarUsuarios(perfilUsuario?.empresaId || undefined);
        const novoSel = atualizado.find(u => u.id === id);
        if (novoSel) setUsuarioSelecionado(novoSel);
      }
    } catch (err: any) {
      console.error("Erro ao editar colaborador:", err);
      throw err;
    } finally {
      setCarregando(false);
    }
  }, [carregarDados, usuarioSelecionado, perfilUsuario]);

  /**
   * Inativa um colaborador.
   */
  const inativarColaborador = useCallback(async (id: string) => {
    try {
      setCarregando(true);
      await repositorioPermissoes.desativarUsuario(id);
      await carregarDados();
      if (usuarioSelecionado && usuarioSelecionado.id === id) {
        setUsuarioSelecionado(null);
        setMatrizPermissoes([]);
      }
    } catch (err: any) {
      console.error("Erro ao inativar colaborador:", err);
      throw err;
    } finally {
      setCarregando(false);
    }
  }, [carregarDados, usuarioSelecionado]);

  /**
   * Carrega o histórico de auditoria de permissões.
   */
  const carregarHistorico = useCallback(async () => {
    if (!perfilUsuario) return;

    try {
      setCarregandoAuditoria(true);
      const logs = await repositorioPermissoes.obterHistoricoAuditoria(perfilUsuario.empresaId || undefined);
      setHistoricoAuditoria(logs);
    } catch (err) {
      console.error("Erro ao carregar auditorias:", err);
    } finally {
      setCarregandoAuditoria(false);
    }
  }, [perfilUsuario]);

  // Carrega histórico de auditoria no mount do hook
  useEffect(() => {
    if (perfilUsuario) {
      carregarHistorico();
    }
  }, [perfilUsuario, carregarHistorico]);

  return {
    usuarios,
    cargos,
    carregando,
    erro,
    vazio,
    usuarioSelecionado,
    matrizPermissoes,
    carregandoPermissoes,
    historicoAuditoria,
    carregandoAuditoria,
    selecionarUsuario,
    salvarPermissoes,
    adicionarUsuario,
    editarUsuario,
    inativarColaborador,
    recarregarUsuarios: carregarDados,
    recarregarHistorico: carregarHistorico
  };
}
