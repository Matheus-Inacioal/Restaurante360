"use client";

import { useState, useCallback, useEffect } from "react";
import type { Processo } from "../lib/types/processos";
import { repositorioProcessos } from "../lib/repositories/repositorio-processos";
import { useToast } from "./use-toast";
import { useTenant } from "./use-tenant";

export function useProcessos() {
    const [processos, setProcessos] = useState<Processo[]>([]);
    const [processoSelecionadoId, setProcessoSelecionadoId] = useState<string | null>(null);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();
    const { empresaId, carregandoTenant } = useTenant();

    const carregarProcessos = useCallback(async () => {
        if (carregandoTenant || !empresaId) return;
        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioProcessos.listarTodos(empresaId);
            setProcessos(data);
        } catch (error) {
            console.error("Erro carregrar processos:", error);
            setErro("Não foi possível carregar a lista de processos.");
            toast({ title: "Erro", description: "Falha ao consultar base de dados.", variant: "destructive" });
        } finally {
            setIsCarregando(false);
        }
    }, [toast, empresaId, carregandoTenant]);

    useEffect(() => {
        carregarProcessos();
    }, [carregarProcessos, empresaId, carregandoTenant]);

    const criarProcesso = async (dados: Omit<Processo, "id" | "criadoEm" | "atualizadoEm" | "ativo" | "versao">) => {
        try {
            if (!empresaId) throw new Error("Acesso negado.");
            const novo = await repositorioProcessos.criar({ ...dados, empresaId } as any);
            setProcessos(prev => [novo, ...prev]);
            toast({ title: "Sucesso", description: `Processo "${novo.titulo}" cadastrado.` });
            return novo;
        } catch (error) {
            toast({ title: "Falha", description: "Não foi possível criar o processo.", variant: "destructive" });
            throw error;
        }
    };

    const editarProcesso = async (id: string, atualizacoes: Partial<Omit<Processo, "id" | "criadoEm" | "atualizadoEm" | "versao">>) => {
        try {
            if (!empresaId) throw new Error("Acesso negado.");
            const up = await repositorioProcessos.atualizar(id, empresaId, atualizacoes);
            setProcessos(prev => prev.map(p => p.id === id ? up : p));
            toast({ title: "Sucesso", description: `Processo atualizado para a versão ${up.versao}.` });
            return up;
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível atualizar o processo.", variant: "destructive" });
            throw error;
        }
    };

    const alternarStatusProcesso = async (processo: Processo) => {
        try {
            if (!empresaId) throw new Error("Acesso negado.");
            const statusTarget = !processo.ativo;
            const up = await repositorioProcessos.atualizar(processo.id, empresaId, { ativo: statusTarget });
            setProcessos(prev => prev.map(p => p.id === processo.id ? up : p));
            toast({ title: statusTarget ? "Ativado" : "Inativado", description: `O processo foi ${statusTarget ? "reativado" : "suspenso"}.` });
            return up;
        } catch {
            toast({ title: "Erro", description: "Falha ao alterar status.", variant: "destructive" });
        }
    };

    const excluirProcesso = async (id: string) => {
        try {
            if (!empresaId) throw new Error("Acesso negado.");
            await repositorioProcessos.excluir(id, empresaId);
            setProcessos(prev => prev.filter(p => p.id !== id));
            if (processoSelecionadoId === id) setProcessoSelecionadoId(null);
            toast({ title: "Processo Deletado", description: "Removido permanentemente da base local." });
        } catch {
            toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
        }
    };

    return {
        processos,
        processoSelecionadoId,
        setProcessoSelecionadoId,
        isCarregando,
        erro,
        carregarProcessos,
        criarProcesso,
        editarProcesso,
        alternarStatusProcesso,
        excluirProcesso
    };
}
