export interface PassoProcesso {
    id: string;
    titulo: string;
    descricao?: string;
    exigeFoto: boolean;
}

export interface Processo {
    id: string;
    titulo: string;
    descricao?: string;
    categoriaId: string;
    passos: PassoProcesso[];
    ativo: boolean;
    versao: number;
    criadoEm: string; // ISO String
    atualizadoEm: string; // ISO String
}
