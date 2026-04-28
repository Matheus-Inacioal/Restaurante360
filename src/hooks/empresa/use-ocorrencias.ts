"use client";

import { useState, useEffect, useCallback } from "react";
import type { OcorrenciaOperacional, OcorrenciaOperacionalCriacao, OcorrenciaOperacionalAtualizacao } from "@/lib/types/operacao/tipos-ocorrencias";
import { repositorioOcorrencias } from "@/lib/repositories/empresa/repositorio-ocorrencias";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";

export function useOcorrencias() {
    const [ocorrencias, setOcorrencias] = useState<OcorrenciaOperacional[]>([]);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();
    const { empresaId, carregandoTenant } = useTenant();

    const carregarOcorrencias = useCallback(async () => {
        if (carregandoTenant) return;

        if (!empresaId) {
            setIsCarregando(false);
            setErro("Acesso negado: Empresa não encontrada.");
            return;
        }

        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioOcorrencias.listar(empresaId);
            setOcorrencias(data);
        } catch (error: any) {
            console.error("Falha ao carregar ocorrências:", error);
            setErro(error.message || "Não foi possível carregar as ocorrências.");
            toast({
                title: "Erro de Comunicação",
                description: "Não foi possível carregar as ocorrências.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast, empresaId, carregandoTenant]);

    useEffect(() => {
        carregarOcorrencias();
    }, [carregarOcorrencias]);

    const criar = async (dados: OcorrenciaOperacionalCriacao) => {
        try {
            const nova = await repositorioOcorrencias.criar(dados);
            setOcorrencias((prev) => [...prev, nova]);
            toast({ title: "Sucesso", description: "Ocorrência registrada." });
            return nova;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao registrar ocorrência.", variant: "destructive" });
            throw error;
        }
    };

    const atualizar = async (id: string, dados: OcorrenciaOperacionalAtualizacao) => {
        try {
            const atualizada = await repositorioOcorrencias.atualizar(id, dados);
            setOcorrencias((prev) => prev.map((o) => (o.id === id ? atualizada : o)));
            toast({ title: "Sucesso", description: "Ocorrência atualizada." });
            return atualizada;
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao atualizar.", variant: "destructive" });
            throw error;
        }
    };

    const excluir = async (id: string) => {
        try {
            await repositorioOcorrencias.excluir(id);
            setOcorrencias((prev) => prev.filter((o) => o.id !== id));
            toast({ title: "Sucesso", description: "Ocorrência excluída." });
        } catch (error: any) {
            toast({ title: "Erro", description: error.message || "Falha ao excluir.", variant: "destructive" });
            throw error;
        }
    };

    return {
        ocorrencias,
        isCarregando,
        erro,
        vazio: !isCarregando && ocorrencias.length === 0,
        criar,
        atualizar,
        excluir,
        recarregar: carregarOcorrencias,
    };
}
