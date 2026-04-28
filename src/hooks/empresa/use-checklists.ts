"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChecklistOperacional, ChecklistOperacionalCriacao, ChecklistOperacionalAtualizacao } from "@/lib/types/operacao/tipos-checklists";
import { repositorioChecklists } from "@/lib/repositories/empresa/repositorio-checklists";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

export function useChecklists() {
    const [checklists, setChecklists] = useState<ChecklistOperacional[]>([]);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();
    const { empresaId, carregandoTenant } = useTenant();

    const carregarChecklists = useCallback(async () => {
        if (carregandoTenant) return;

        if (!empresaId) {
            setIsCarregando(false);
            setErro("Acesso negado: Empresa não encontrada.");
            return;
        }

        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioChecklists.listar(empresaId);
            setChecklists(data);
        } catch (error: any) {
            console.error("Falha ao carregar checklists:", error);
            setErro(error.message || "Não foi possível carregar os checklists.");
            toast({
                title: "Erro de Comunicação",
                description: "Não foi possível carregar os checklists.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast, empresaId, carregandoTenant]);

    useEffect(() => {
        carregarChecklists();
    }, [carregarChecklists]);

    const criar = async (dados: ChecklistOperacionalCriacao) => {
        try {
            const nova = await repositorioChecklists.criar(dados);
            setChecklists((prev) => [...prev, nova]);
            toast({ title: "Sucesso", description: "Checklist criado com sucesso." });
            return nova;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao criar checklist.", variant: "destructive" });
            throw error;
        }
    };

    const atualizar = async (id: string, dados: ChecklistOperacionalAtualizacao) => {
        try {
            const atualizada = await repositorioChecklists.atualizar(id, dados);
            setChecklists((prev) => prev.map((c) => (c.id === id ? atualizada : c)));
            toast({ title: "Sucesso", description: "Checklist atualizado." });
            return atualizada;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao atualizar.", variant: "destructive" });
            throw error;
        }
    };

    const excluir = async (id: string) => {
        try {
            await repositorioChecklists.excluir(id);
            setChecklists((prev) => prev.filter((c) => c.id !== id));
            toast({ title: "Sucesso", description: "Checklist excluído." });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao excluir.", variant: "destructive" });
            throw error;
        }
    };

    return {
        checklists,
        isCarregando,
        erro,
        vazio: !isCarregando && checklists.length === 0,
        criar,
        atualizar,
        excluir,
        recarregar: carregarChecklists,
    };
}
