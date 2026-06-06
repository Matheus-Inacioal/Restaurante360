/**
 * Hook useMeuPonto — Restaurante360
 *
 * Hook para o colaborador gerenciar seu próprio ponto.
 * Implementa os 4 estados UI: carregando, vazio, erro, sucesso.
 *
 * Funcionalidades:
 * - Estado da jornada (qual botão exibir)
 * - Registrar batida (com captura de geolocalização)
 * - Histórico pessoal
 * - Saldo de banco de horas
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { repositorioPonto } from "@/lib/repositories/repositorio-ponto";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
import { usePerfil } from "@/hooks/use-perfil";
import type {
  EstadoJornadaAtual,
  RegistroPonto,
  TipoRegistroPonto,
} from "@/lib/tipos/ponto";

export function useMeuPonto() {
  // Estado da jornada
  const [estadoJornada, setEstadoJornada] = useState<EstadoJornadaAtual | null>(null);

  // Histórico
  const [historico, setHistorico] = useState<RegistroPonto[]>([]);

  // Saldo
  const [saldo, setSaldo] = useState<{
    acumulado: {
      saldoAcumuladoMinutos: number;
      totalTrabalhadoMinutos: number;
      totalHoraExtraMinutos: number;
      totalAtrasoMinutos: number;
      diasRegistrados: number;
    };
    mensal: {
      saldoMensalMinutos: number;
      totalTrabalhadoMinutos: number;
      diasTrabalhados: number;
    } | null;
  } | null>(null);

  // 4 estados UI
  const [isCarregando, setIsCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);

  const { toast } = useToast();
  const { empresaId, carregandoTenant } = useTenant();
  const { perfilUsuario, carregandoPerfil } = usePerfil();

  // ─── Carregar estado da jornada ─────────────────────────────

  const carregarEstado = useCallback(async () => {
    if (carregandoTenant || carregandoPerfil || !empresaId) return;

    setIsCarregando(true);
    setErro(null);

    try {
      const [estado, saldoDados] = await Promise.all([
        repositorioPonto.obterEstadoJornada(),
        repositorioPonto.obterSaldo(
          new Date().getMonth() + 1,
          new Date().getFullYear()
        ),
      ]);

      setEstadoJornada(estado);
      setSaldo(saldoDados);
    } catch (error: any) {
      console.error("Erro ao carregar estado do ponto:", error);
      setErro("Não foi possível carregar os dados do ponto.");
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do ponto.",
        variant: "destructive",
      });
    } finally {
      setIsCarregando(false);
    }
  }, [empresaId, carregandoTenant, carregandoPerfil, toast]);

  useEffect(() => {
    carregarEstado();
  }, [carregarEstado]);

  // ─── Carregar histórico ─────────────────────────────────────

  const carregarHistorico = useCallback(
    async (dataInicio?: string, dataFim?: string) => {
      if (!empresaId) return;

      try {
        const dados = await repositorioPonto.obterHistorico(dataInicio, dataFim);
        setHistorico(dados);
      } catch (error: any) {
        console.error("Erro ao carregar histórico:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar histórico de ponto.",
          variant: "destructive",
        });
      }
    },
    [empresaId, toast]
  );

  // ─── Registrar batida ──────────────────────────────────────

  const registrarBatida = useCallback(
    async (tipoRegistro: TipoRegistroPonto) => {
      if (!empresaId) return;

      setRegistrando(true);

      try {
        // Capturar geolocalização
        let latitude: number | undefined;
        let longitude: number | undefined;

        if ("geolocation" in navigator) {
          try {
            const posicao = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 0,
                });
              }
            );
            latitude = posicao.coords.latitude;
            longitude = posicao.coords.longitude;
          } catch (geoError) {
            console.warn("Geolocalização não disponível:", geoError);
            // Continuar sem geo — a API decidirá se permite
          }
        }

        const resultado = await repositorioPonto.registrarBatida({
          tipoRegistro,
          latitude,
          longitude,
          origemRegistro: "app_web",
        });

        toast({
          title: "Ponto Registrado!",
          description: resultado.mensagem,
        });

        // Recarregar estado
        await carregarEstado();

        return resultado;
      } catch (error: any) {
        const mensagem = error.message || "Falha ao registrar ponto.";
        toast({
          title: "Erro ao Registrar",
          description: mensagem,
          variant: "destructive",
        });
        throw error;
      } finally {
        setRegistrando(false);
      }
    },
    [empresaId, carregarEstado, toast]
  );

  // ─── Retorno ────────────────────────────────────────────────

  return {
    // Estado
    estadoJornada,
    historico,
    saldo,

    // 4 estados UI
    isCarregando,
    erro,
    registrando,
    vazio: !isCarregando && !estadoJornada,

    // Ações
    registrarBatida,
    carregarHistorico,
    recarregar: carregarEstado,
  };
}
