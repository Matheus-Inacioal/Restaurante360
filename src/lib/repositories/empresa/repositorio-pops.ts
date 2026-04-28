import { fetchJSON } from "../../http/fetch-json";
import type { PopOperacional, PopOperacionalCriacao, PopOperacionalAtualizacao } from "../../types/operacao/tipos-pops";

export class RepositorioPops {
    async listar(empresaId: string): Promise<PopOperacional[]> {
        const res = await fetchJSON<PopOperacional[]>(`/api/empresa/pops`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterPorId(id: string): Promise<PopOperacional> {
        const res = await fetchJSON<PopOperacional>(`/api/empresa/pops/${id}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async criar(dados: PopOperacionalCriacao): Promise<PopOperacional> {
        const res = await fetchJSON<PopOperacional>(`/api/empresa/pops`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, dados: PopOperacionalAtualizacao): Promise<PopOperacional> {
        const res = await fetchJSON<PopOperacional>(`/api/empresa/pops/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/pops/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }
}

export const repositorioPops = new RepositorioPops();
