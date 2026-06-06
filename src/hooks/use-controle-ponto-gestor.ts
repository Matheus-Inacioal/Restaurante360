/**
 * Hook useControlePontoGestor — Restaurante360
 *
 * Hook para o gestor controlar o ponto dos colaboradores.
 * Implementa os 4 estados UI: carregando, vazio, erro, sucesso.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { repositorioPonto } from "@/lib/repositories/repositorio-ponto";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { usePerfil } from "@/hooks/use-perfil";
import type {
  RelatoriosPonto,
  FiltrosPontoGestor,
  AuditoriaPonto,
} from "@/lib/tipos/ponto";

export function useControlePontoGestor() {
  // Dados
  const [planilha, setPlanilha] = useState<RelatoriosPonto | null>(null);
  const [auditoria, setAuditoria] = useState<AuditoriaPonto[]>([]);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosPontoGestor>({
    data: new Date().toISOString().split("T")[0],
  });

  // 4 estados UI
  const [isCarregando, setIsCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const { toast } = useToast();
  const { empresaId, unidadeId, carregandoTenant } = useTenant();
  const { perfilUsuario, carregandoPerfil } = usePerfil();

  // ─── Carregar planilha ─────────────────────────────────────

  const carregarPlanilha = useCallback(async () => {
    if (carregandoTenant || carregandoPerfil || !empresaId) return;

    setIsCarregando(true);
    setErro(null);

    try {
      const dados = await repositorioPonto.obterPlanilhaGestor({
        ...filtros,
        unidadeId: filtros.unidadeId ?? unidadeId ?? undefined,
      });

      setPlanilha(dados);
    } catch (error: any) {
      console.error("Erro ao carregar planilha:", error);
      setErro("Não foi possível carregar o controle de ponto.");
      toast({
        title: "Erro",
        description: "Falha ao carregar controle de ponto.",
        variant: "destructive",
      });
    } finally {
      setIsCarregando(false);
    }
  }, [empresaId, unidadeId, filtros, carregandoTenant, carregandoPerfil, toast]);

  useEffect(() => {
    carregarPlanilha();
  }, [carregarPlanilha]);

  // ─── Aplicar filtros ───────────────────────────────────────

  const aplicarFiltros = useCallback((novosFiltros: Partial<FiltrosPontoGestor>) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  }, []);

  // ─── Ajustar ponto ─────────────────────────────────────────

  const ajustarPonto = useCallback(
    async (registroPontoId: string, horarioAjustado: string, motivo: string) => {
      try {
        await repositorioPonto.registrarAjuste({
          registroPontoId,
          horarioAjustado,
          motivo,
        });

        toast({
          title: "Ajuste Registrado",
          description: "O ajuste de ponto foi registrado com sucesso.",
        });

        await carregarPlanilha();
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Falha ao registrar ajuste.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [carregarPlanilha, toast]
  );

  // ─── Justificar falta ──────────────────────────────────────

  const justificarFalta = useCallback(
    async (dados: {
      colaboradorId: string;
      dataReferencia: string;
      motivo: string;
      observacao?: string;
    }) => {
      try {
        await repositorioPonto.registrarJustificativa(dados);

        toast({
          title: "Justificativa Registrada",
          description: "A justificativa foi registrada e aguarda aprovação.",
        });

        await carregarPlanilha();
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message || "Falha ao registrar justificativa.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [carregarPlanilha, toast]
  );

  // ─── Carregar auditoria ────────────────────────────────────

  const carregarAuditoria = useCallback(
    async (registroId?: string) => {
      try {
        const logs = await repositorioPonto.obterAuditoria({ registroId });
        setAuditoria(logs);
        return logs;
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Falha ao carregar auditoria.",
          variant: "destructive",
        });
        return [];
      }
    },
    [toast]
  );

  // ─── Exportar relatório ────────────────────────────────────

  const exportarRelatorio = useCallback(
    async (tipo: "diario" | "semanal" | "mensal", formato: "pdf" | "excel" | "csv") => {
      try {
        const relatorio = await repositorioPonto.obterRelatorio({
          tipo,
          data: filtros.data,
          unidadeId: filtros.unidadeId ?? unidadeId ?? undefined,
          colaboradorId: filtros.colaboradorId,
        });

        // Retornar dados para o componente de exportação processar
        return relatorio;
      } catch (error: any) {
        toast({
          title: "Erro",
          description: "Falha ao gerar relatório.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [filtros, unidadeId, toast]
  );

  // ─── Retorno ────────────────────────────────────────────────

  return {
    // Dados
    planilha,
    auditoria,
    filtros,

    // 4 estados UI
    isCarregando,
    erro,
    vazio: !isCarregando && (!planilha || planilha.linhas.length === 0),

    // Ações
    aplicarFiltros,
    ajustarPonto,
    justificarFalta,
    carregarAuditoria,
    exportarRelatorio,
    recarregar: carregarPlanilha,
  };
}
