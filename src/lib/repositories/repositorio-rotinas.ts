import { fetchJSON } from "../http/fetch-json";
import type { Rotina, GeracaoRotinaDiaria } from "../types/rotinas";

export interface RepositorioRotinas {
    obterTodas(empresaId: string): Promise<Rotina[]>;
    obterAtivas(empresaId: string): Promise<Rotina[]>;
    obterPorId(id: string, empresaId: string): Promise<Rotina | null>;
    criar(rotina: Omit<Rotina, "id" | "criadoEm" | "atualizadoEm">): Promise<Rotina>;
    atualizar(id: string, empresaId: string, atualizacoes: Partial<Rotina>): Promise<Rotina>;
    excluir(id: string, empresaId: string): Promise<void>;

    // Histórico de geração
    verificarGeracaoExistente(rotinaId: string, dataReferencia: string, empresaId: string): Promise<boolean>;
    registrarGeracao(geracao: Omit<GeracaoRotinaDiaria, "id" | "criadoEm">): Promise<GeracaoRotinaDiaria>;
    obterHistoricoRecente(rotinaId: string, empresaId: string, limite?: number): Promise<GeracaoRotinaDiaria[]>;
}

export class RepositorioRotinasRest implements RepositorioRotinas {
    async obterTodas(empresaId: string): Promise<Rotina[]> {
        const res = await fetchJSON<Rotina[]>(`/api/empresa/rotinas?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterAtivas(empresaId: string): Promise<Rotina[]> {
        const rotinas = await this.obterTodas(empresaId);
        return rotinas.filter(r => r.ativa);
    }

    async obterPorId(id: string, empresaId: string): Promise<Rotina | null> {
        const res = await fetchJSON<Rotina>(`/api/empresa/rotinas/${id}?empresaId=${empresaId}`);
        if (!res.ok) return null;
        return res.data;
    }

    async criar(dadosRotina: Omit<Rotina, "id" | "criadoEm" | "atualizadoEm">): Promise<Rotina> {
        if (!dadosRotina.empresaId || !dadosRotina.criadoPor) {
            throw new Error("Falha de Governança: Toda rotina exige empresaId e id do criador.");
        }
        const res = await fetchJSON<Rotina>(`/api/empresa/rotinas`, {
            method: 'POST',
            body: JSON.stringify(dadosRotina)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async atualizar(id: string, empresaId: string, atualizacoes: Partial<Rotina>): Promise<Rotina> {
        const res = await fetchJSON<Rotina>(`/api/empresa/rotinas/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ empresaId, atualizacoes })
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async excluir(id: string, empresaId: string): Promise<void> {
        const res = await fetchJSON<{ success: boolean }>(`/api/empresa/rotinas/${id}?empresaId=${empresaId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(res.message);
    }

    // -- Histórico de Geração
    async verificarGeracaoExistente(rotinaId: string, dataReferencia: string, empresaId: string): Promise<boolean> {
        // Aproveitamos o listar passando parametro genérico, mas filtrando no client p manter simplicidade,
        // ou criar endpoint customizado depois. Por enquanto pega todas as geracoes dessa rotina.
        try {
            const res = await fetchJSON<GeracaoRotinaDiaria[]>(`/api/empresa/geracoes?empresaId=${empresaId}`);
            if (!res.ok) return false;
            return res.data.some(g => g.rotinaId === rotinaId && g.dataReferencia === dataReferencia);
        } catch {
            return false;
        }
    }

    async registrarGeracao(dadosGeracao: Omit<GeracaoRotinaDiaria, "id" | "criadoEm">): Promise<GeracaoRotinaDiaria> {
        if (!dadosGeracao.empresaId || !dadosGeracao.rotinaId) {
            throw new Error("Falha de Governança: Toda geração exige empresaId e rotinaId.");
        }
        const res = await fetchJSON<GeracaoRotinaDiaria>(`/api/empresa/geracoes`, {
            method: 'POST',
            body: JSON.stringify(dadosGeracao)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    }

    async obterHistoricoRecente(rotinaId: string, empresaId: string, limite: number = 7): Promise<GeracaoRotinaDiaria[]> {
        const res = await fetchJSON<GeracaoRotinaDiaria[]>(`/api/empresa/geracoes?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data
            .filter(g => g.rotinaId === rotinaId)
            .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
            .slice(0, limite);
    }
}

export const repositorioRotinas = new RepositorioRotinasRest();
