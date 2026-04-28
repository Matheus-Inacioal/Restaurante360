import { fetchJSON } from "../../http/fetch-json";
import type { ReceitaPreparo, ReceitaPreparoCriacao, ReceitaPreparoAtualizacao } from "../../types/operacao/tipos-receitas-preparos";

export class RepositorioReceitasPreparos {
    async listar(empresaId: string): Promise<ReceitaPreparo[]> {
        const res = await fetchJSON<ReceitaPreparo[]>(`/api/empresa/receitas-preparos`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterPorId(id: string): Promise<ReceitaPreparo> {
        const res = await fetchJSON<ReceitaPreparo>(`/api/empresa/receitas-preparos/${id}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async criar(dados: ReceitaPreparoCriacao): Promise<ReceitaPreparo> {
        const res = await fetchJSON<ReceitaPreparo>(`/api/empresa/receitas-preparos`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, dados: ReceitaPreparoAtualizacao): Promise<ReceitaPreparo> {
        const res = await fetchJSON<ReceitaPreparo>(`/api/empresa/receitas-preparos/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/receitas-preparos/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }
}

export const repositorioReceitasPreparos = new RepositorioReceitasPreparos();
