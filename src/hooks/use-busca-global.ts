import { useState, useMemo } from 'react';
import { useTarefas } from './use-tarefas';
import { useRotinas } from './use-rotinas';
import { useProcessos } from './use-processos';
import { useUsuarios } from './use-usuarios';

export type CategoriaBusca = 'Tarefas' | 'Rotinas' | 'Processos' | 'Usuários';

export type ResultadoBusca = {
    id: string;
    titulo: string;
    descricao?: string;
    categoria: CategoriaBusca;
    url: string;
};

export function useBuscaGlobal() {
    const [busca, setBusca] = useState('');
    const { tarefas } = useTarefas();
    const { rotinas } = useRotinas();
    const { processos } = useProcessos();
    const { usuarios } = useUsuarios();

    const resultados = useMemo(() => {
        if (!busca.trim()) return [];

        const termo = busca.toLowerCase();
        const matches: ResultadoBusca[] = [];

        // Tarefas
        tarefas.forEach((t) => {
            if (
                t.titulo.toLowerCase().includes(termo) ||
                t.descricao?.toLowerCase().includes(termo)
            ) {
                matches.push({
                    id: t.id,
                    titulo: t.titulo,
                    descricao: t.descricao,
                    categoria: 'Tarefas',
                    url: `/empresa/tarefas?id=${t.id}`,
                });
            }
        });

        // Rotinas
        rotinas.forEach((r) => {
            if (
                r.titulo.toLowerCase().includes(termo) ||
                r.descricao?.toLowerCase().includes(termo)
            ) {
                matches.push({
                    id: r.id,
                    titulo: r.titulo,
                    descricao: r.descricao,
                    categoria: 'Rotinas',
                    url: `/empresa/rotinas?id=${r.id}`,
                });
            }
        });

        // Processos
        processos.forEach((p) => {
            const nomeCat = p.categoriaId || '';
            if (
                p.titulo.toLowerCase().includes(termo) ||
                p.descricao?.toLowerCase().includes(termo) ||
                nomeCat.toLowerCase().includes(termo)
            ) {
                matches.push({
                    id: p.id,
                    titulo: p.titulo,
                    descricao: p.descricao || nomeCat,
                    categoria: 'Processos',
                    url: `/empresa/processos?id=${p.id}`,
                });
            }
        });

        // Usuários
        if (usuarios && Array.isArray(usuarios)) {
            usuarios.forEach((u) => {
                if (
                    u.nome.toLowerCase().includes(termo) ||
                    u.email.toLowerCase().includes(termo)
                ) {
                    matches.push({
                        id: u.id,
                        titulo: u.nome,
                        descricao: u.email,
                        categoria: 'Usuários',
                        url: `/empresa/usuarios?id=${u.id}`,
                    });
                }
            });
        }

        return matches;
    }, [busca, tarefas, rotinas, processos, usuarios]);

    const agrupados = useMemo(() => {
        const grupos: Record<CategoriaBusca, ResultadoBusca[]> = {
            Tarefas: [],
            Rotinas: [],
            Processos: [],
            Usuários: [],
        };
        resultados.forEach((r) => grupos[r.categoria].push(r));
        return grupos;
    }, [resultados]);

    return {
        busca,
        setBusca,
        resultados,
        agrupados,
    };
}
