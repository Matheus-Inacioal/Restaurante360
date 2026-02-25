import type { Tarefa, StatusTarefa } from "../types/tarefas";

export interface RepositorioTarefas {
    obterTodas(empresaId: string): Promise<Tarefa[]>;
    obterPorId(id: string, empresaId: string): Promise<Tarefa | null>;
    criar(tarefa: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm">): Promise<Tarefa>;
    atualizar(id: string, empresaId: string, atualizacoes: Partial<Tarefa>): Promise<Tarefa>;
    excluir(id: string, empresaId: string): Promise<void>;
}

const LOCAL_STORAGE_KEY = "r360_tarefas";

export class RepositorioTarefasLocal implements RepositorioTarefas {
    private obterTarefasDoStorage(): Tarefa[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    private salvarTarefasNoStorage(tarefas: Tarefa[]): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tarefas));
        }
    }

    async obterTodas(empresaId: string): Promise<Tarefa[]> {
        const tarefas = this.obterTarefasDoStorage();
        return tarefas.filter(t => t.empresaId === empresaId);
    }

    async obterPorId(id: string, empresaId: string): Promise<Tarefa | null> {
        const tarefas = this.obterTarefasDoStorage();
        return tarefas.find((t) => t.id === id && t.empresaId === empresaId) || null;
    }

    async criar(dadosTarefa: Omit<Tarefa, "id" | "criadoEm" | "atualizadoEm">): Promise<Tarefa> {
        const tarefas = this.obterTarefasDoStorage();
        const agora = new Date().toISOString();

        // Garantia de segurança (Anti-bypass)
        if (!dadosTarefa.empresaId || !dadosTarefa.criadoPor) {
            throw new Error("Falha de Governança: Toda tarefa exige empresaId e id do criador.");
        }

        const novaTarefa: Tarefa = {
            ...dadosTarefa,
            id: crypto.randomUUID(),
            criadoEm: agora,
            atualizadoEm: agora,
        };

        tarefas.push(novaTarefa);
        this.salvarTarefasNoStorage(tarefas);
        return novaTarefa;
    }

    async atualizar(id: string, empresaId: string, atualizacoes: Partial<Tarefa>): Promise<Tarefa> {
        const tarefas = this.obterTarefasDoStorage();
        const index = tarefas.findIndex((t) => t.id === id && t.empresaId === empresaId);

        if (index === -1) {
            throw new Error(`Tarefa com ID ${id} não encontrada ou sem permissão de acesso.`);
        }

        const tarefaAtualizada: Tarefa = {
            ...tarefas[index],
            ...atualizacoes,
            atualizadoEm: new Date().toISOString(),
        };

        tarefas[index] = tarefaAtualizada;
        this.salvarTarefasNoStorage(tarefas);
        return tarefaAtualizada;
    }

    async excluir(id: string, empresaId: string): Promise<void> {
        const tarefas = this.obterTarefasDoStorage();
        const indice = tarefas.findIndex((t) => t.id === id && t.empresaId === empresaId);

        if (indice === -1) {
            throw new Error("Permissão negada ou tarefa inexistente.");
        }

        const tarefasFiltradas = tarefas.filter((t) => t.id !== id);
        this.salvarTarefasNoStorage(tarefasFiltradas);
    }
}

// Export da Instância singleton Local
export const repositorioTarefas = new RepositorioTarefasLocal();
