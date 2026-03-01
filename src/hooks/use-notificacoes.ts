'use client';

import { useState, useEffect, useCallback } from 'react';
import { Notificacao } from '../lib/types/notificacoes';
import { notificacoesRepository } from '../lib/repositories/notificacoes-repository';

export function useNotificacoes() {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [carregando, setCarregando] = useState(true);

    const carregarNotificacoes = useCallback(() => {
        try {
            setCarregando(true);
            const res = notificacoesRepository.obterTodas();
            // Ordena pelas mais recentes primeiro
            const ordenadas = res.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
            setNotificacoes(ordenadas);
        } catch (e) {
            console.error('Erro ao carregar notificações:', e);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarNotificacoes();

        // Simula escutar eventos de polling para o MVP (no futuro Firebase event-driven)
        const interval = setInterval(() => {
            carregarNotificacoes();
        }, 1000 * 60 * 5); // Polling cada 5 min caso alterado em outra tab

        return () => clearInterval(interval);
    }, [carregarNotificacoes]);

    const marcarComoLida = async (id: string) => {
        notificacoesRepository.marcarComoLida(id);
        carregarNotificacoes(); // Revalida estado otimista
    };

    const marcarTodasComoLidas = async () => {
        notificacoesRepository.marcarTodasComoLidas();
        carregarNotificacoes();
    };

    const excluirNotificacao = async (id: string) => {
        notificacoesRepository.excluir(id);
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
