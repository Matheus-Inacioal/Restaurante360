import type { Processo, PassoProcesso } from "../types/processos";
import { repositorioCategorias } from "./repositorio-categorias";

export interface RepositorioProcessos {
    listarTodos(): Promise<Processo[]>;
    obterPorId(id: string): Promise<Processo | null>;
    criar(dados: Omit<Processo, "id" | "criadoEm" | "atualizadoEm" | "ativo" | "versao">): Promise<Processo>;
    atualizar(id: string, atualizacoes: Partial<Processo>): Promise<Processo>;
    excluir(id: string): Promise<void>;
}

const LOCAL_STORAGE_KEY_PROCESSOS = "r360_processos";

export class RepositorioProcessosLocal implements RepositorioProcessos {
    constructor() {
        this.inicializarSeedSeNecessario();
    }

    private obterProcessosDoStorage(): Processo[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(LOCAL_STORAGE_KEY_PROCESSOS);
        const parseados = data ? JSON.parse(data) : [];

        // Garante suporte legado p/ versao qnd carrega nulos:
        return parseados.map((p: any) => ({
            ...p,
            versao: p.versao || 1
        }));
    }

    private salvarProcessosNoStorage(processos: Processo[]): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY_PROCESSOS, JSON.stringify(processos));
        }
    }

    private async inicializarSeedSeNecessario(): Promise<void> {
        if (typeof window === "undefined") return;

        const processosExistentes = this.obterProcessosDoStorage();
        if (processosExistentes.length === 0) {
            // Obter categorias para vincular corretamente o ID
            const categorias = await repositorioCategorias.obterTodas("processos");
            const catEstoque = categorias.find(c => c.nome.includes("Estoque"))?.id || "nova-cat-id-estoque";
            const catCaixa = categorias.find(c => c.nome.includes("Caixa") || c.nome.includes("Financeiro"))?.id || "nova-cat-id-caixa";

            const dataAtual = new Date().toISOString();

            const seed: Processo[] = [
                {
                    id: crypto.randomUUID(),
                    titulo: "Recebimento de Material",
                    descricao: "Passo a passo padrão para o recebimento de fornecedores, conferência de NFs e armazenamento em estoque.",
                    categoriaId: catEstoque,
                    ativo: true,
                    versao: 1,
                    criadoEm: dataAtual,
                    atualizadoEm: dataAtual,
                    passos: [
                        { id: crypto.randomUUID(), titulo: "Conferir Nota Fiscal contra o Pedido de Compra", exigeFoto: false },
                        { id: crypto.randomUUID(), titulo: "Inspecionar integridade das embalagens", exigeFoto: false },
                        { id: crypto.randomUUID(), titulo: "Conferir data de validade dos perecíveis", exigeFoto: true },
                        { id: crypto.randomUUID(), titulo: "Armazenar itens resfriados/congelados imediatamente", exigeFoto: false },
                        { id: crypto.randomUUID(), titulo: "Assinar canhoto e devolver ao entregador", exigeFoto: false },
                    ]
                },
                {
                    id: crypto.randomUUID(),
                    titulo: "Fechamento de Caixa",
                    descricao: "Procedimentos de encerramento de turno, contagem de numerário e emissão de relatórios do PDV.",
                    categoriaId: catCaixa,
                    ativo: true,
                    versao: 1,
                    criadoEm: dataAtual,
                    atualizadoEm: dataAtual,
                    passos: [
                        { id: crypto.randomUUID(), titulo: "Emitir Redução Z no PDV", exigeFoto: true },
                        { id: crypto.randomUUID(), titulo: "Contar fundo de troco (R$ 150,00)", exigeFoto: false },
                        { id: crypto.randomUUID(), titulo: "Contar dinheiro em espécie das vendas", exigeFoto: false },
                        { id: crypto.randomUUID(), titulo: "Conferir comprovantes de cartão com relatório", exigeFoto: false },
                        { id: crypto.randomUUID(), titulo: "Lacrar malote e colocar no cofre", exigeFoto: true },
                    ]
                }
            ];

            this.salvarProcessosNoStorage(seed);
        }
    }

    async listarTodos(): Promise<Processo[]> {
        const processos = this.obterProcessosDoStorage();
        // Ordenar do mais novo para o mais antigo por padrão
        return processos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    }

    async obterPorId(id: string): Promise<Processo | null> {
        const processos = this.obterProcessosDoStorage();
        return processos.find(p => p.id === id) || null;
    }

    async criar(dados: Omit<Processo, "id" | "criadoEm" | "atualizadoEm" | "ativo" | "versao">): Promise<Processo> {
        const processos = this.obterProcessosDoStorage();
        const dataAtual = new Date().toISOString();

        const novoProcesso: Processo = {
            id: crypto.randomUUID(),
            ...dados,
            ativo: true,
            versao: 1,
            criadoEm: dataAtual,
            atualizadoEm: dataAtual,
        };

        processos.push(novoProcesso);
        this.salvarProcessosNoStorage(processos);

        return novoProcesso;
    }

    async atualizar(id: string, atualizacoes: Partial<Processo>): Promise<Processo> {
        const processos = this.obterProcessosDoStorage();
        const index = processos.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error(`Processo ${id} não encontrado.`);
        }

        const processoAtualizado: Processo = {
            ...processos[index],
            ...atualizacoes,
            versao: (processos[index].versao || 1) + 1,
            atualizadoEm: new Date().toISOString(),
        };

        processos[index] = processoAtualizado;
        this.salvarProcessosNoStorage(processos);
        return processoAtualizado;
    }

    async excluir(id: string): Promise<void> {
        const processos = this.obterProcessosDoStorage();
        const novaLista = processos.filter(p => p.id !== id);
        this.salvarProcessosNoStorage(novaLista);
    }
}

export const repositorioProcessos = new RepositorioProcessosLocal();
