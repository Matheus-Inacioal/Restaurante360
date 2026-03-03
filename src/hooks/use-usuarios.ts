"use client";

import { useState, useEffect, useCallback } from "react";
import type { UsuarioSistema } from "../lib/types/usuarios";
import { repositorioUsuarios } from "../lib/repositories/usuarios-repository";
import { useToast } from "@/hooks/use-toast";

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();

    const carregarUsuarios = useCallback(async () => {
        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioUsuarios.listarUsuarios();
            setUsuarios(data);
        } catch (error: any) {
            console.error("Falha ao carregar usuários:", error);
            setErro("Não foi possível carregar a lista de usuários.");
            toast({
                title: "Erro de Comunicação",
                description: "Lista de usuários indisponível no momento.",
                variant: "destructive",
            });
        } finally {
            setIsCarregando(false);
        }
    }, [toast]);

    useEffect(() => {
        carregarUsuarios();
    }, [carregarUsuarios]);

    const adicionarUsuario = async (
        dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">
    ) => {
        try {
            const payload = { ...dados };

            const novo = await repositorioUsuarios.criarUsuario(payload);
            setUsuarios((prev) => [...prev, novo]);

            toast({
                title: "Usuário Criado",
                description: `"${novo.nome}" foi adicionado com sucesso.`,
            });
            return novo;
        } catch (error: any) {
            toast({
                title: "Falha na Criação",
                description: error.message || "Não foi possível criar o usuário.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const editarUsuario = async (id: string, atualizacoes: Partial<UsuarioSistema>) => {
        try {
            const atualizado = await repositorioUsuarios.atualizarUsuario(id, atualizacoes);
            setUsuarios((prev) => prev.map((u) => (u.id === id ? atualizado : u)));

            toast({
                title: "Usuário Atualizado",
                description: "As informações foram salvas.",
            });
            return atualizado;
        } catch (error: any) {
            toast({
                title: "Erro na Atualização",
                description: error.message || "Não foi possível salvar as alterações.",
                variant: "destructive",
            });
            throw error;
        }
    };



    const inativar = async (id: string, nomeUsuario: string) => {
        try {
            await repositorioUsuarios.inativarUsuario(id);
            setUsuarios((prev) =>
                prev.map((u) => (u.id === id ? { ...u, status: "inativo", atualizadoEm: new Date().toISOString() } : u))
            );

            toast({
                title: "Acesso Revogado",
                description: `O usuário ${nomeUsuario} foi inativado.`,
            });
        } catch (error: any) {
            toast({
                title: "Erro na Inativação",
                description: "Não foi possível suspender os acessos temporariamente.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const reativar = async (id: string, nomeUsuario: string) => {
        try {
            await repositorioUsuarios.reativarUsuario(id);
            setUsuarios((prev) =>
                prev.map((u) => (u.id === id ? { ...u, status: "ativo", atualizadoEm: new Date().toISOString() } : u))
            );

            toast({
                title: "Acesso Restabelecido",
                description: `O usuário ${nomeUsuario} foi reativado.`,
            });
        } catch (error: any) {
            toast({
                title: "Erro na Reativação",
                description: "Houve um erro ao liberar os acessos novamente.",
                variant: "destructive",
            });
            throw error;
        }
    };

    return {
        usuarios,
        isCarregando,
        erro,
        vazio: !isCarregando && usuarios.length === 0,
        adicionarUsuario,
        editarUsuario,
        inativar,
        reativar,
        recarregarUsuarios: carregarUsuarios,
    };
}
