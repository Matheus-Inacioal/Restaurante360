import { fetchJSON } from "../http/fetch-json";
import type { Categoria, TipoCategoria } from "../types/categorias";

export interface RepositorioCategorias {
    obterTodas(tipo: TipoCategoria | undefined, empresaId: string): Promise<Categoria[]>;
    criar(dados: Omit<Categoria, "id" | "criadoEm" | "atualizadoEm" | "ativa"> & { empresaId: string }): Promise<Categoria>;
    atualizar(id: string, empresaId: string, atualizacoes: Partial<Categoria>): Promise<Categoria>;
    excluir(id: string, empresaId: string): Promise<void>;
}

export class RepositorioCategoriasRest implements RepositorioCategorias {
    async obterTodas(tipo: TipoCategoria | undefined, empresaId: string): Promise<Categoria[]> {
        const res = await fetchJSON<Categoria[]>(`/api/empresa/categorias?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data.filter(c => !tipo || c.tipo === tipo || c.tipo === "geral");
    }

    async criar(dados: Omit<Categoria, "id" | "criadoEm" | "atualizadoEm" | "ativa"> & { empresaId: string }): Promise<Categoria> {
        const res = await fetchJSON<Categoria>(`/api/empresa/categorias`, {
            method: 'POST',
            body: JSON.stringify({ ...dados, ativa: true })
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, empresaId: string, atualizacoes: Partial<Categoria>): Promise<Categoria> {
        const res = await fetchJSON<Categoria>(`/api/empresa/categorias/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ empresaId, atualizacoes })
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string, empresaId: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/categorias/${id}?empresaId=${empresaId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }
}

export const repositorioCategorias = new RepositorioCategoriasRest();
