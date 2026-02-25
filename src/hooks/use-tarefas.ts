"use client";

import { useState, useEffect, useCallback } from "react";
import type { Tarefa, StatusTarefa } from "../lib/types/tarefas";
import { repositorioTarefas } from "../lib/repositories/repositorio-tarefas";
import { useToast } from "@/hooks/use-toast";

// MOCK: ID fixo de empresa e usuario para simular ambiente logado até o auth estar fundido
const MOCK_EMPRESA_ID = "empresa_demo_123";
const MOCK_USUARIO_ID = "user_matheus_99";

export function useTarefas() {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);

    // OS 4 ESTADOS UI EXIGIDOS
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();

    const carregarTarefas = useCallback(async () => {
        setIsCarregando(true);
        setErro(null);
        try {
            // Injetando exigência Multi-Tenant localmente
            const data = await repositorioTarefas.obterTodas(MOCK_EMPRESA_ID);
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
    }, [carregarTarefas]);

    const adicionarTarefa = async (dadosDaTarefa: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">) => {
        try {
            // Injeta parâmetros de governança nativamente por baixo dos panos (User não envia isso)
            const nova = await repositorioTarefas.criar({
                ...dadosDaTarefa,
                empresaId: MOCK_EMPRESA_ID,
                criadoPor: MOCK_USUARIO_ID
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
            const tarefaAtualizada = await repositorioTarefas.atualizar(id, MOCK_EMPRESA_ID, atualizacoes);
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
            await repositorioTarefas.excluir(id, MOCK_EMPRESA_ID);
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
