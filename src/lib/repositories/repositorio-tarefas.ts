import { fetchJSON } from "../http/fetch-json";
import type { Tarefa } from "../types/tarefas";

export interface RepositorioTarefas {
    obterTodas(empresaId: string): Promise<Tarefa[]>;
    obterPorId(id: string, empresaId: string): Promise<Tarefa | null>;
    criar(tarefa: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm">): Promise<Tarefa>;
    atualizar(id: string, empresaId: string, atualizacoes: Partial<Tarefa>): Promise<Tarefa>;
    excluir(id: string, empresaId: string): Promise<void>;
}

export class RepositorioTarefasRest implements RepositorioTarefas {
    async obterTodas(empresaId: string): Promise<Tarefa[]> {
        const res = await fetchJSON<Tarefa[]>(`/api/empresa/tarefas?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterPorId(id: string, empresaId: string): Promise<Tarefa | null> {
        const res = await fetchJSON<Tarefa>(`/api/empresa/tarefas/${id}?empresaId=${empresaId}`);
        if (!res.ok) return null;
        return res.data;
    }

    async criar(dadosTarefa: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm">): Promise<Tarefa> {
        if (!dadosTarefa.empresaId || !dadosTarefa.criadoPor) {
            throw new Error("Falha de Governança: Toda tarefa exige empresaId e id do criador.");
        }
        const res = await fetchJSON<Tarefa>(`/api/empresa/tarefas`, {
            method: 'POST',
            body: JSON.stringify(dadosTarefa)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, empresaId: string, atualizacoes: Partial<Tarefa>): Promise<Tarefa> {
        const res = await fetchJSON<Tarefa>(`/api/empresa/tarefas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ empresaId, atualizacoes })
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string, empresaId: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/tarefas/${id}?empresaId=${empresaId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }
}

export const repositorioTarefas = new RepositorioTarefasRest();
