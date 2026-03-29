'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchJSON, FetchJsonError } from '@/lib/http/fetch-json';
import { EmpresaAtualizada, StatusEmpresa } from '@/lib/types/financeiro';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type CriarEmpresaInput = {
    nomeEmpresa: string;
    cnpj: string;
    nomeResponsavel: string;
    emailResponsavel: string;
    whatsappResponsavel: string;
    planoId: string;
    diasTrial?: number;
};

type EstadoLista = 'carregando' | 'sucesso' | 'vazio' | 'erro';

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useEmpresasSistema() {
    // Estado da listagem
    const [empresas, setEmpresas] = useState<EmpresaAtualizada[]>([]);
    const [estadoLista, setEstadoLista] = useState<EstadoLista>('carregando');
    const [erroLista, setErroLista] = useState<string | null>(null);

    // Filtros (client-side)
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<StatusEmpresa | 'TODOS'>('TODOS');

    // Estado de criação
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const [globalError, setGlobalError] = useState<string | null>(null);

    // ─── Listagem ───────────────────────────────────────────────────────

    const carregarEmpresas = useCallback(async () => {
        setEstadoLista('carregando');
        setErroLista(null);

        try {
            const res = await fetchJSON<{ data: EmpresaAtualizada[] }>('/api/sistema/empresas?limit=500');

            if (res.ok && res.data) {
                const lista = (res.data as any).data || res.data;
                const listaFinal = Array.isArray(lista) ? lista : [];
                setEmpresas(listaFinal);
                setEstadoLista(listaFinal.length > 0 ? 'sucesso' : 'vazio');
            } else {
                setEmpresas([]);
                setEstadoLista('vazio');
            }
        } catch (error: any) {
            console.error('[useEmpresasSistema] Erro ao listar:', error);
            setErroLista(error?.message || 'Erro ao carregar empresas.');
            setEstadoLista('erro');
        }
    }, []);

    useEffect(() => {
        carregarEmpresas();
    }, [carregarEmpresas]);

    // ─── Filtros (client-side via useMemo) ──────────────────────────────

    const empresasFiltradas = useMemo(() => {
        let resultado = empresas;

        if (filtroStatus !== 'TODOS') {
            resultado = resultado.filter(e => e.status === filtroStatus);
        }

        if (busca.trim()) {
            const termo = busca.toLowerCase().trim();
            resultado = resultado.filter(e =>
                e.nome?.toLowerCase().includes(termo) ||
                e.responsavelNome?.toLowerCase().includes(termo) ||
                e.responsavelEmail?.toLowerCase().includes(termo) ||
                e.cnpj?.includes(termo)
            );
        }

        return resultado;
    }, [empresas, busca, filtroStatus]);

    // ─── Criação ────────────────────────────────────────────────────────

    const criarEmpresa = async (dados: CriarEmpresaInput): Promise<boolean> => {
        setIsLoading(true);
        setFieldErrors({});
        setGlobalError(null);

        try {
            await fetchJSON('/api/sistema/empresas/criar', {
                method: 'POST',
                body: JSON.stringify(dados),
                headers: { 'Content-Type': 'application/json' }
            });

            // Recarregar lista após criação
            await carregarEmpresas();
            return true;
        } catch (error) {
            const err = error as FetchJsonError;
            if (err.status === 400 && err.issues) {
                setFieldErrors(err.issues as Record<string, string[]>);
            } else {
                setGlobalError(err.message || 'Ocorreu um erro ao criar a empresa.');
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        // Listagem
        empresas,
        empresasFiltradas,
        estadoLista,
        erroLista,
        recarregar: carregarEmpresas,

        // Filtros
        busca,
        setBusca,
        filtroStatus,
        setFiltroStatus,

        // Criação
        criarEmpresa,
        isLoading,
        fieldErrors,
        globalError,
    };
}
