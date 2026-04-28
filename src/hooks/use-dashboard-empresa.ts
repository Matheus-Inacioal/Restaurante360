"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardEmpresaData } from "../lib/types/dashboard-empresa";
import { repositorioDashboardEmpresa } from "../lib/repositories/repositorio-dashboard-empresa";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "./use-tenant";

export function useDashboardEmpresa() {
    const [dados, setDados] = useState<DashboardEmpresaData | null>(null);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();
    const { empresaId, carregandoTenant } = useTenant();

    const carregarDashboard = useCallback(async () => {
        if (carregandoTenant) return;

        if (!empresaId) {
            setIsCarregando(false);
            setErro("Sessão da empresa não encontrada.");
            return;
        }

        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioDashboardEmpresa.obterConsolidado();
            setDados(data);
        } catch (error: any) {
            console.error("Falha ao carregar dashboard:", error);
            setErro(error.message || "Não foi possível carregar os dados do painel.");
            toast({
                title: "Erro de Comunicação",
                description: "O painel da empresa está indisponível no momento.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast, empresaId, carregandoTenant]);

    useEffect(() => {
        carregarDashboard();
    }, [carregarDashboard]);

    // Verificação de vazio. Pode ser adaptado se necessário baseando nas tarefas ou total
    const vazio = !isCarregando && dados?.executionTodayTotal === 0 && dados?.activeTeam === 0;

    return {
        dados,
        isCarregando,
        erro,
        vazio,
        recarregar: carregarDashboard,
    };
}
