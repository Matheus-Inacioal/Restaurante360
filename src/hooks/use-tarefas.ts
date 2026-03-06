"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tarefa, StatusTarefa } from "../lib/types/tarefas";
import { repositorioTarefas } from "../lib/repositories/repositorio-tarefas";
import { useToast } from "@/hooks/use-toast";

import { useTenant } from "@/hooks/use-tenant";
import { usePerfil } from "@/hooks/use-perfil";
export function useTarefas() {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);

    // OS 4 ESTADOS UI EXIGIDOS
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();

    const { empresaId, carregandoTenant } = useTenant();
    const { perfilUsuario, carregandoPerfil } = usePerfil();

    const carregarTarefas = useCallback(async () => {
        if (carregandoTenant || carregandoPerfil) return;

        if (!empresaId) {
            setIsCarregando(false);
            return;
        }

        setIsCarregando(true);
        setErro(null);
        try {
            // Context Local via FB Auth
            const data = await repositorioTarefas.obterTodas(empresaId);
            if (!Array.isArray(data)) {
                console.error("obterTodas() não retornou array:", data);
                setTarefas([]);
                return;
            }
            setTarefas(data);
        } catch (error) {
            console.error("Falha ao carregar tarefas:", error);
            setErro("Não foi possível estabelecer contato com a base temporal.");
            toast({
                title: "Erro de Comunicação",
                description: "Suas tarefas não puderam ser carregadas no momento.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast]);

    useEffect(() => {
        carregarTarefas();
    }, [empresaId, carregandoTenant, carregandoPerfil, carregarTarefas]);

    const adicionarTarefa = async (dadosDaTarefa: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">) => {
        try {
            if (!empresaId || !perfilUsuario) throw new Error("Não Autenticado ou Contexto Indefinido");

            const nova = await repositorioTarefas.criar({
                ...dadosDaTarefa,
                empresaId: empresaId,
                criadoPor: perfilUsuario.uid
            });

            setTarefas((prev) => [...prev, nova]);

            toast({
                title: "Sucesso!",
                description: `"${nova.titulo}" registrada.`,
            });
            return nova;
        } catch (error) {
            toast({
                title: "Operação Bloqueada",
                description: "Falha ao gravar registro.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const atualizarTarefa = async (id: string, atualizacoes: Partial<Tarefa>) => {
        try {
            if (!empresaId) throw new Error("Aceso negado");
            const tarefaAtualizada = await repositorioTarefas.atualizar(id, empresaId, atualizacoes);
            setTarefas((prev) => prev.map((t) => (t.id === id ? tarefaAtualizada : t)));
            return tarefaAtualizada;
        } catch (error) {
            toast({
                title: "Erro de Persistência",
                description: "Seu acesso ou a tarefa podem estar revogados.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const excluirTarefa = async (id: string) => {
        try {
            if (!empresaId) throw new Error("Aceso negado");
            await repositorioTarefas.excluir(id, empresaId);
            setTarefas((prev) => prev.filter((t) => t.id !== id));
            toast({
                title: "Limpeza Rápida",
                description: "A tarefa foi incinerada fisicamente.",
            });
        } catch (error) {
            toast({
                title: "Falha Geral",
                description: "Não foi possível arquivar ou excluir.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const atualizarStatusTarefa = async (id: string, status: StatusTarefa) => {
        return atualizarTarefa(id, { status });
    };

    return {
        tarefas,
        isCarregando,
        erro,
        vazio: !isCarregando && tarefas.length === 0,
        adicionarTarefa,
        atualizarTarefa,
        excluirTarefa,
        atualizarStatusTarefa,
        recarregarTarefas: carregarTarefas,
    };
}
