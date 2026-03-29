"use client";

import { useState, useEffect, useCallback } from "react";
import type { UsuarioSistema } from "../lib/types/usuarios";
import { repositorioUsuarios } from "../lib/repositories/usuarios-repository";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "./use-tenant";

export function useUsuarios() {
    const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
    const [isCarregando, setIsCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const { toast } = useToast();
    const { empresaId, carregandoTenant } = useTenant();

    const carregarUsuarios = useCallback(async () => {
        if (carregandoTenant) return;

        if (!empresaId) {
            setIsCarregando(false);
            return;
        }

        setIsCarregando(true);
        setErro(null);
        try {
            const data = await repositorioUsuarios.listarUsuarios(empresaId);
            if (!Array.isArray(data)) {
                console.error("obterTodas() não retornou array:", data);
                setUsuarios([]);
                return;
            }
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
    }, [toast, empresaId, carregandoTenant]);

    useEffect(() => {
        carregarUsuarios();
    }, [carregarUsuarios, empresaId, carregandoTenant]);

    const adicionarUsuario = async (
        dados: Omit<UsuarioSistema, "id" | "criadoEm" | "atualizadoEm">
    ) => {
        try {
            if (!empresaId) throw new Error("Acesso negado.");
            const payload = { ...dados, empresaId } as any;

            const novo = await repositorioUsuarios.criarUsuario(payload);
            setUsuarios((prev) => [...prev, novo]);

            toast({
                title: "Colaborador Criado",
                description: `"${novo.nome}" foi adicionado à equipe. Um link de redefinição de senha será enviado por e-mail.`,
            });

            return novo;
        } catch (error: any) {
            toast({
                title: "Falha na Criação",
                description: error.message || "Não foi possível criar o colaborador.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const editarUsuario = async (id: string, atualizacoes: Partial<UsuarioSistema>) => {
        try {
            if (!empresaId) throw new Error("Acesso negado.");
            const atualizado = await repositorioUsuarios.atualizarUsuario(id, empresaId, atualizacoes);
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

    const redefinirSenha = async (email: string, nomeColaborador: string) => {
        try {
            const resultado = await repositorioUsuarios.enviarLinkRedefinicaoSenha(email);

            toast({
                title: "Link Enviado",
                description: `Um link de redefinição de senha foi gerado para ${nomeColaborador}.`,
            });

            // Em dev, loga o link se retornado
            if (resultado.linkRedefinicao) {
                console.log(`[DEV] Link de redefinição para ${email}:`, resultado.linkRedefinicao);
            }

            return resultado;
        } catch (error: any) {
            toast({
                title: "Falha na Redefinição",
                description: error.message || "Não foi possível gerar o link de redefinição.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const inativar = async (id: string, nomeUsuario: string) => {
        try {
            if (!empresaId) throw new Error("Acesso negado.");
            await repositorioUsuarios.inativarUsuario(id, empresaId);
            setUsuarios((prev) =>
                prev.map((u) => (u.id === id ? { ...u, status: "inativo" as const, atualizadoEm: new Date().toISOString() } : u))
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
            if (!empresaId) throw new Error("Acesso negado.");
            await repositorioUsuarios.reativarUsuario(id, empresaId);
            setUsuarios((prev) =>
                prev.map((u) => (u.id === id ? { ...u, status: "ativo" as const, atualizadoEm: new Date().toISOString() } : u))
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
        redefinirSenha,
        inativar,
        reativar,
        recarregarUsuarios: carregarUsuarios,
    };
}
