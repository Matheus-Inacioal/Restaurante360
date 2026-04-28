import { fetchJSON } from "../../http/fetch-json";
import type { ChecklistOperacional, ChecklistOperacionalCriacao, ChecklistOperacionalAtualizacao } from "../../types/operacao/tipos-checklists";

export class RepositorioChecklists {
    async listar(empresaId: string): Promise<ChecklistOperacional[]> {
        const res = await fetchJSON<ChecklistOperacional[]>(`/api/empresa/checklists`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterPorId(id: string): Promise<ChecklistOperacional> {
        const res = await fetchJSON<ChecklistOperacional>(`/api/empresa/checklists/${id}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async criar(dados: ChecklistOperacionalCriacao): Promise<ChecklistOperacional> {
        const res = await fetchJSON<ChecklistOperacional>(`/api/empresa/checklists`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, dados: ChecklistOperacionalAtualizacao): Promise<ChecklistOperacional> {
        const res = await fetchJSON<ChecklistOperacional>(`/api/empresa/checklists/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/checklists/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }
}

export const repositorioChecklists = new RepositorioChecklists();
