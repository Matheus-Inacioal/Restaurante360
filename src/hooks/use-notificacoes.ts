'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notificacao } from '../lib/types/notificacoes';
import { notificacoesRepository } from '../lib/repositories/notificacoes-repository';
import { useTenant } from './use-tenant';

export function useNotificacoes() {
    const { empresaId, carregandoTenant } = useTenant();
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [carregando, setCarregando] = useState(true);

    const carregarNotificacoes = useCallback(async () => {
        if (!empresaId) return;

        try {
            setCarregando(true);
            const res = await notificacoesRepository.obterTodas(empresaId);

            if (!Array.isArray(res)) {
                console.error("obterTodas() não retornou array:", res);
                setNotificacoes([]);
                return;
            }

            // Ordena pelas mais recentes primeiro
            const ordenadas = res.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
            setNotificacoes(ordenadas);
        } catch (e) {
            console.error('Erro ao carregar notificações:', e);
            setNotificacoes([]);
        } finally {
            setCarregando(false);
        }
    }, [empresaId]);

    useEffect(() => {
        if (carregandoTenant || !empresaId) return;

        carregarNotificacoes();

        // Simula escutar eventos de polling para o MVP (no futuro Firebase event-driven)
        const interval = setInterval(() => {
            carregarNotificacoes();
        }, 1000 * 60 * 5); // Polling cada 5 min caso alterado em outra tab

        return () => clearInterval(interval);
    }, [carregarNotificacoes, empresaId, carregandoTenant]);

    const marcarComoLida = async (id: string) => {
        if (!empresaId) return;
        await notificacoesRepository.marcarComoLida(id, empresaId);
        carregarNotificacoes(); // Revalida estado otimista
    };

    const marcarTodasComoLidas = async () => {
        if (!empresaId) return;
        await notificacoesRepository.marcarTodasComoLidas(empresaId);
        carregarNotificacoes();
    };

    const excluirNotificacao = async (id: string) => {
        if (!empresaId) return;
        await notificacoesRepository.excluir(id, empresaId);
        carregarNotificacoes();
    };

    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    return {
        notificacoes,
        carregando,
        naoLidas,
        marcarComoLida,
        marcarTodasComoLidas,
        excluirNotificacao,
        recarregar: carregarNotificacoes
    };
}
