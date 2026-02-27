"use client";

import { useState, useCallback, useEffect } from "react";
import type { Categoria, TipoCategoria } from "../lib/types/categorias";
import { repositorioCategorias } from "../lib/repositories/repositorio-categorias";
import { useToast } from "./use-toast";

export function useCategorias(tipoPredefinido?: TipoCategoria) {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();

    const carregarCategorias = useCallback(async (tipoBusca?: TipoCategoria) => {
        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioCategorias.obterTodas(tipoBusca || tipoPredefinido);
            // Ordenar por "ordem"
            const dataOrdenada = data.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
            setCategorias(dataOrdenada);
        } catch (error) {
            console.error("Erro carregrar categorias:", error);
            setErro("Não foi possível carregar as categorias.");
        } finally {
            setIsCarregando(false);
        }
    }, [tipoPredefinido]);

    useEffect(() => {
        carregarCategorias();
    }, [carregarCategorias]);

    const criarCategoria = async (nome: string, tipoCriacao: TipoCategoria) => {
        try {
            const nova = await repositorioCategorias.criar({ nome, tipo: tipoCriacao });

            // Revalidar apenas se a criacao bater com o tipo do hook montado
            if (!tipoPredefinido || tipoCriacao === tipoPredefinido) {
                setCategorias(prev => [...prev, nova].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
            }

            toast({ title: "Categoria Criada", description: `"${nova.nome}" cadastrada com sucesso.` });
            return nova;
        } catch (error) {
            toast({ title: "Falha", description: "Não foi possível criar categoria.", variant: "destructive" });
            throw error;
        }
    };

    const atualizarCategoria = async (id: string, atualizacoes: Partial<Categoria>) => {
        try {
            const up = await repositorioCategorias.atualizar(id, atualizacoes);
            setCategorias(prev => prev.map(c => c.id === id ? up : c).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
            return up;
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
            throw error;
        }
    };

    const alternarStatus = async (categoria: Categoria) => {
        const metodo = categoria.ativa ? repositorioCategorias.inativar : repositorioCategorias.ativar;
        try {
            const statusStr = categoria.ativa ? "inativada" : "ativada";
            const up = await metodo(categoria.id);
            setCategorias(prev => prev.map(c => c.id === categoria.id ? up : c));
            toast({ title: "Status Atualizado", description: `A categoria foi ${statusStr}.` });
            return up;
        } catch {
            toast({ title: "Erro", description: "Falha ao alterar status.", variant: "destructive" });
        }
    };

    const excluirCategoria = async (id: string) => {
        try {
            await repositorioCategorias.excluir(id);
            setCategorias(prev => prev.filter(c => c.id !== id));
            toast({ title: "Categoria Excluída", description: "A categoria desapareceu permanentemente." });
        } catch {
            toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
        }
    };

    return {
        categorias,
        isCarregando,
        erro,
        carregarCategorias,
        criarCategoria,
        atualizarCategoria,
        alternarStatus,
        excluirCategoria
    };
}
