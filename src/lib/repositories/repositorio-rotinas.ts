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

const LOCAL_STORAGE_KEY_ROTINAS = "r360_rotinas";
const LOCAL_STORAGE_KEY_GERACOES = "r360_geracoes_rotinas";

export class RepositorioRotinasLocal implements RepositorioRotinas {
    private obterRotinasDoStorage(): Rotina[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(LOCAL_STORAGE_KEY_ROTINAS);
        const rotinas: Rotina[] = data ? JSON.parse(data) : [];
        return rotinas.map(r => ({ ...r, frequencia: r.frequencia || "diaria" }));
    }

    private salvarRotinasNoStorage(rotinas: Rotina[]): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY_ROTINAS, JSON.stringify(rotinas));
        }
    }

    private obterGeracoesDoStorage(): GeracaoRotinaDiaria[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(LOCAL_STORAGE_KEY_GERACOES);
        return data ? JSON.parse(data) : [];
    }

    private salvarGeracoesNoStorage(geracoes: GeracaoRotinaDiaria[]): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY_GERACOES, JSON.stringify(geracoes));
        }
    }

    async obterTodas(empresaId: string): Promise<Rotina[]> {
        const rotinas = this.obterRotinasDoStorage();
        return rotinas.filter(r => r.empresaId === empresaId);
    }

    async obterAtivas(empresaId: string): Promise<Rotina[]> {
        const rotinas = this.obterRotinasDoStorage();
        return rotinas.filter(r => r.empresaId === empresaId && r.ativa);
    }

    async obterPorId(id: string, empresaId: string): Promise<Rotina | null> {
        const rotinas = this.obterRotinasDoStorage();
        return rotinas.find((r) => r.id === id && r.empresaId === empresaId) || null;
    }

    async criar(dadosRotina: Omit<Rotina, "id" | "criadoEm" | "atualizadoEm">): Promise<Rotina> {
        const rotinas = this.obterRotinasDoStorage();
        const agora = new Date().toISOString();

        if (!dadosRotina.empresaId || !dadosRotina.criadoPor) {
            throw new Error("Falha de Governança: Toda rotina exige empresaId e id do criador.");
        }

        const novaRotina: Rotina = {
            ...dadosRotina,
            id: crypto.randomUUID(),
            criadoEm: agora,
            atualizadoEm: agora,
        };

        rotinas.push(novaRotina);
        this.salvarRotinasNoStorage(rotinas);
        return novaRotina;
    }

    async atualizar(id: string, empresaId: string, atualizacoes: Partial<Rotina>): Promise<Rotina> {
        const rotinas = this.obterRotinasDoStorage();
        const index = rotinas.findIndex((r) => r.id === id && r.empresaId === empresaId);

        if (index === -1) {
            throw new Error(`Rotina com ID ${id} não encontrada ou sem permissão de acesso.`);
        }

        const rotinaAtualizada: Rotina = {
            ...rotinas[index],
            ...atualizacoes,
            atualizadoEm: new Date().toISOString(),
        };

        rotinas[index] = rotinaAtualizada;
        this.salvarRotinasNoStorage(rotinas);
        return rotinaAtualizada;
    }

    async excluir(id: string, empresaId: string): Promise<void> {
        const rotinas = this.obterRotinasDoStorage();
        const indice = rotinas.findIndex((r) => r.id === id && r.empresaId === empresaId);

        if (indice === -1) {
            throw new Error("Permissão negada ou rotina inexistente.");
        }

        const rotinasFiltradas = rotinas.filter((r) => r.id !== id);
        this.salvarRotinasNoStorage(rotinasFiltradas);
        // Não apagar o histórico de gerações por motivos de auditoria
    }

    async verificarGeracaoExistente(rotinaId: string, dataReferencia: string, empresaId: string): Promise<boolean> {
        const geracoes = this.obterGeracoesDoStorage();
        return geracoes.some(g => g.rotinaId === rotinaId && g.dataReferencia === dataReferencia && g.empresaId === empresaId);
    }

    async registrarGeracao(dadosGeracao: Omit<GeracaoRotinaDiaria, "id" | "criadoEm">): Promise<GeracaoRotinaDiaria> {
        const geracoes = this.obterGeracoesDoStorage();

        if (!dadosGeracao.empresaId || !dadosGeracao.rotinaId) {
            throw new Error("Falha de Governança: Toda geração de rotina exige empresaId e rotinaId.");
        }

        const novaGeracao: GeracaoRotinaDiaria = {
            ...dadosGeracao,
            id: crypto.randomUUID(),
            criadoEm: new Date().toISOString(),
        };

        geracoes.push(novaGeracao);
        this.salvarGeracoesNoStorage(geracoes);
        return novaGeracao;
    }

    async obterHistoricoRecente(rotinaId: string, empresaId: string, limite: number = 7): Promise<GeracaoRotinaDiaria[]> {
        const geracoes = this.obterGeracoesDoStorage();
        return geracoes
            .filter(g => g.rotinaId === rotinaId && g.empresaId === empresaId)
            .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
            .slice(0, limite);
    }
}

export const repositorioRotinas = new RepositorioRotinasLocal();
