export type TipoCategoria = "processos" | "rotinas" | "tarefas" | "geral";

export interface Categoria {
    id: string;
    nome: string;
    tipo: TipoCategoria;
    ativa: boolean;
    ordem?: number;
    criadoEm: string; // ISO
    atualizadoEm: string; // ISO
}
