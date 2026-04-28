import { fetchJSON } from "../../http/fetch-json";
import type { OcorrenciaOperacional, OcorrenciaOperacionalCriacao, OcorrenciaOperacionalAtualizacao } from "../../types/operacao/tipos-ocorrencias";

export class RepositorioOcorrencias {
    async listar(empresaId: string): Promise<OcorrenciaOperacional[]> {
        const res = await fetchJSON<OcorrenciaOperacional[]>(`/api/empresa/ocorrencias`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterPorId(id: string): Promise<OcorrenciaOperacional> {
        const res = await fetchJSON<OcorrenciaOperacional>(`/api/empresa/ocorrencias/${id}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async criar(dados: OcorrenciaOperacionalCriacao): Promise<OcorrenciaOperacional> {
        const res = await fetchJSON<OcorrenciaOperacional>(`/api/empresa/ocorrencias`, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, dados: OcorrenciaOperacionalAtualizacao): Promise<OcorrenciaOperacional> {
        const res = await fetchJSON<OcorrenciaOperacional>(`/api/empresa/ocorrencias/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(dados)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/ocorrencias/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }
}

export const repositorioOcorrencias = new RepositorioOcorrencias();
