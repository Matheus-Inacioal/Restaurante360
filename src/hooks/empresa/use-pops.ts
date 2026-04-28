"use client";

import { useState, useEffect, useCallback } from "react";
import type { PopOperacional, PopOperacionalCriacao, PopOperacionalAtualizacao } from "@/lib/types/operacao/tipos-pops";
import { repositorioPops } from "@/lib/repositories/empresa/repositorio-pops";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

export function usePops() {
    const [pops, setPops] = useState<PopOperacional[]>([]);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();
    const { empresaId, carregandoTenant } = useTenant();

    const carregarPops = useCallback(async () => {
        if (carregandoTenant) return;

        if (!empresaId) {
            setIsCarregando(false);
            setErro("Acesso negado: Empresa não encontrada.");
            return;
        }

        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioPops.listar(empresaId);
            setPops(data);
        } catch (error: any) {
            console.error("Falha ao carregar POPs:", error);
            setErro(error.message || "Não foi possível carregar os POPs.");
            toast({
                title: "Erro de Comunicação",
                description: "Não foi possível carregar a base de POPs.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast, empresaId, carregandoTenant]);

    useEffect(() => {
        carregarPops();
    }, [carregarPops]);

    const criar = async (dados: PopOperacionalCriacao) => {
        try {
            const nova = await repositorioPops.criar(dados);
            setPops((prev) => [...prev, nova]);
            toast({ title: "Sucesso", description: "POP criado com sucesso." });
            return nova;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao criar POP.", variant: "destructive" });
            throw error;
        }
    };

    const atualizar = async (id: string, dados: PopOperacionalAtualizacao) => {
        try {
            const atualizada = await repositorioPops.atualizar(id, dados);
            setPops((prev) => prev.map((p) => (p.id === id ? atualizada : p)));
            toast({ title: "Sucesso", description: "POP atualizado." });
            return atualizada;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao atualizar.", variant: "destructive" });
            throw error;
        }
    };

    const excluir = async (id: string) => {
        try {
            await repositorioPops.excluir(id);
            setPops((prev) => prev.filter((p) => p.id !== id));
            toast({ title: "Sucesso", description: "POP excluído." });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao excluir.", variant: "destructive" });
            throw error;
        }
    };

    return {
        pops,
        isCarregando,
        erro,
        vazio: !isCarregando && pops.length === 0,
        criar,
        atualizar,
        excluir,
        recarregar: carregarPops,
    };
}
