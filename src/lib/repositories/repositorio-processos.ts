import { fetchJSON } from "../http/fetch-json";
import type { Processo, PassoProcesso } from "../types/processos";

export interface RepositorioProcessos {
    listarTodos(empresaId: string): Promise<Processo[]>;
    obterPorId(id: string, empresaId: string): Promise<Processo | null>;
    criar(dados: Omit<Processo, "id" | "criadoEm" | "atualizadoEm" | "ativo" | "versao">): Promise<Processo>;
    atualizar(id: string, empresaId: string, atualizacoes: Partial<Processo>): Promise<Processo>;
    excluir(id: string, empresaId: string): Promise<void>;
}

export class RepositorioProcessosRest implements RepositorioProcessos {
    async listarTodos(empresaId: string): Promise<Processo[]> {
        const res = await fetchJSON<Processo[]>(`/api/empresa/processos?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterPorId(id: string, empresaId: string): Promise<Processo | null> {
        const res = await fetchJSON<Processo>(`/api/empresa/processos/${id}?empresaId=${empresaId}`);
        if (!res.ok) return null;
        return res.data;
    }

    async criar(dados: Omit<Processo, "id" | "criadoEm" | "atualizadoEm" | "ativo" | "versao">): Promise<Processo> {
        const payload = {
            ...dados,
            ativo: true,
            versao: 1
        };
        const res = await fetchJSON<Processo>(`/api/empresa/processos`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, empresaId: string, atualizacoes: Partial<Processo>): Promise<Processo> {
        const res = await fetchJSON<Processo>(`/api/empresa/processos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ empresaId, atualizacoes })
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string, empresaId: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/processos/${id}?empresaId=${empresaId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }
}

export const repositorioProcessos = new RepositorioProcessosRest();
