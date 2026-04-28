import type { StatusAtivo } from "@prisma/client";

export interface IngredienteReceita {
    nome: string;
    quantidade: number;
    unidadeMedida: string;
}

export interface MidiaReceita {
    url: string;
    tipo: 'imagem' | 'video';
    titulo?: string;
}

export interface ReceitaPreparo {
    id: string;
    empresaId: string;
    unidadeId?: string | null;
    nome: string;
    categoria?: string | null;
    descricao?: string | null;
    ingredientes?: IngredienteReceita[] | null;
    proporcoes?: string | null;
    rendimento?: string | null;
    validade?: string | null;
    tempoPreparoMinutos?: number | null;
    modoPreparo?: string | null;
    observacoes?: string | null;
    midias?: MidiaReceita[] | null;
    status: StatusAtivo;
    criadoPor: string;
    criadoEm: Date | string;
    atualizadoEm: Date | string;
}

export type ReceitaPreparoCriacao = Omit<ReceitaPreparo, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">;
export type ReceitaPreparoAtualizacao = Partial<ReceitaPreparoCriacao>;
