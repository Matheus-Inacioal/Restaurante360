"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReceitaPreparo, ReceitaPreparoCriacao, ReceitaPreparoAtualizacao } from "@/lib/types/operacao/tipos-receitas-preparos";
import { repositorioReceitasPreparos } from "@/lib/repositories/empresa/repositorio-receitas-preparos";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

export function useReceitasPreparos() {
    const [receitas, setReceitas] = useState<ReceitaPreparo[]>([]);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();
    const { empresaId, carregandoTenant } = useTenant();

    const carregarReceitas = useCallback(async () => {
        if (carregandoTenant) return;

        if (!empresaId) {
            setIsCarregando(false);
            setErro("Acesso negado: Empresa não encontrada.");
            return;
        }

        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioReceitasPreparos.listar(empresaId);
            setReceitas(data);
        } catch (error: any) {
            console.error("Falha ao carregar receitas:", error);
            setErro(error.message || "Não foi possível carregar as receitas.");
            toast({
                title: "Erro de Comunicação",
                description: "Não foi possível carregar a base de receitas.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast, empresaId, carregandoTenant]);

    useEffect(() => {
        carregarReceitas();
    }, [carregarReceitas]);

    const criar = async (dados: ReceitaPreparoCriacao) => {
        try {
            const nova = await repositorioReceitasPreparos.criar(dados);
            setReceitas((prev) => [...prev, nova]);
            toast({ title: "Sucesso", description: "Receita criada com sucesso." });
            return nova;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao criar receita.", variant: "destructive" });
            throw error;
        }
    };

    const atualizar = async (id: string, dados: ReceitaPreparoAtualizacao) => {
        try {
            const atualizada = await repositorioReceitasPreparos.atualizar(id, dados);
            setReceitas((prev) => prev.map((r) => (r.id === id ? atualizada : r)));
            toast({ title: "Sucesso", description: "Receita atualizada." });
            return atualizada;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao atualizar.", variant: "destructive" });
            throw error;
        }
    };

    const excluir = async (id: string) => {
        try {
            await repositorioReceitasPreparos.excluir(id);
            setReceitas((prev) => prev.filter((r) => r.id !== id));
            toast({ title: "Sucesso", description: "Receita excluída." });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao excluir.", variant: "destructive" });
            throw error;
        }
    };

    return {
        receitas,
        isCarregando,
        erro,
        vazio: !isCarregando && receitas.length === 0,
        criar,
        atualizar,
        excluir,
        recarregar: carregarReceitas,
    };
}
