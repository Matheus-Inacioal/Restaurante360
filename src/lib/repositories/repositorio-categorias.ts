import type { Categoria, TipoCategoria } from "../types/categorias";

export interface RepositorioCategorias {
    obterTodas(tipo?: TipoCategoria): Promise<Categoria[]>;
    criar(dados: { nome: string; tipo: TipoCategoria }): Promise<Categoria>;
    atualizar(id: string, atualizacoes: Partial<Categoria>): Promise<Categoria>;
    inativar(id: string): Promise<Categoria>;
    ativar(id: string): Promise<Categoria>;
    excluir(id: string): Promise<void>;
}

const LOCAL_STORAGE_KEY_CATEGORIAS = "r360_categorias";

const CATEGORIAS_PADRAO_PROCESSOS = [
    "Estoque & Compras",
    "Cozinha",
    "Atendimento",
    "Caixa / Financeiro",
    "Higiene & Limpeza",
    "Manutenção"
];

export class RepositorioCategoriasLocal implements RepositorioCategorias {
    constructor() {
        this.inicializarCategoriasPadrao();
    }

    private obterCategoriasDoStorage(): Categoria[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIAS);
        return data ? JSON.parse(data) : [];
    }

    private salvarCategoriasNoStorage(categorias: Categoria[]): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIAS, JSON.stringify(categorias));
        }
    }

    private inicializarCategoriasPadrao(): void {
        if (typeof window === "undefined") return;

        const categorias = this.obterCategoriasDoStorage();
        if (categorias.filter(c => c.tipo === "processos").length === 0) {
            const dataAtual = new Date().toISOString();
            const categoriasPadrao: Categoria[] = CATEGORIAS_PADRAO_PROCESSOS.map((nome, index) => ({
                id: crypto.randomUUID(),
                nome,
                tipo: "processos",
                ativa: true,
                ordem: index,
                criadoEm: dataAtual,
                atualizadoEm: dataAtual,
            }));

            this.salvarCategoriasNoStorage([...categorias, ...categoriasPadrao]);
        }
    }

    async obterTodas(tipo?: TipoCategoria): Promise<Categoria[]> {
        const categorias = this.obterCategoriasDoStorage();
        if (tipo) {
            return categorias.filter(c => c.tipo === tipo);
        }
        return categorias;
    }

    async criar(dados: { nome: string; tipo: TipoCategoria }): Promise<Categoria> {
        const categorias = this.obterCategoriasDoStorage();
        const dataAtual = new Date().toISOString();

        // Pega a maior ordem para colocar no fim
        const doMesmoTipo = categorias.filter(c => c.tipo === dados.tipo);
        const ordem = doMesmoTipo.length > 0 ? Math.max(...doMesmoTipo.map(c => c.ordem || 0)) + 1 : 0;

        const novaCategoria: Categoria = {
            id: crypto.randomUUID(),
            nome: dados.nome.trim(),
            tipo: dados.tipo,
            ativa: true,
            ordem,
            criadoEm: dataAtual,
            atualizadoEm: dataAtual,
        };

        categorias.push(novaCategoria);
        this.salvarCategoriasNoStorage(categorias);
        return novaCategoria;
    }

    async atualizar(id: string, atualizacoes: Partial<Categoria>): Promise<Categoria> {
        const categorias = this.obterCategoriasDoStorage();
        const index = categorias.findIndex(c => c.id === id);

        if (index === -1) {
            throw new Error(`Categoria ${id} não encontrada.`);
        }

        const categoriaAtualizada: Categoria = {
            ...categorias[index],
            ...atualizacoes,
            atualizadoEm: new Date().toISOString(),
        };

        categorias[index] = categoriaAtualizada;
        this.salvarCategoriasNoStorage(categorias);
        return categoriaAtualizada;
    }

    async inativar(id: string): Promise<Categoria> {
        return this.atualizar(id, { ativa: false });
    }

    async ativar(id: string): Promise<Categoria> {
        return this.atualizar(id, { ativa: true });
    }

    async excluir(id: string): Promise<void> {
        const categorias = this.obterCategoriasDoStorage();
        const novaLista = categorias.filter(c => c.id !== id);
        this.salvarCategoriasNoStorage(novaLista);
    }
}

export const repositorioCategorias = new RepositorioCategoriasLocal();
