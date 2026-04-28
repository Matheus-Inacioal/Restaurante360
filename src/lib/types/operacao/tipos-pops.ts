import type { StatusAtivo } from "@prisma/client";

export interface EtapaPop {
    ordem: number;
    titulo: string;
    descricao?: string;
    midiaUrl?: string;
}

export interface PopOperacional {
    id: string;
    empresaId: string;
    unidadeId?: string | null;
    nome: string;
    categoria?: string | null;
    objetivo?: string | null;
    quandoExecutar?: string | null;
    setor?: string | null;
    responsavel?: string | null;
    materiaisNecessarios?: string | null;
    etapas?: EtapaPop[] | null;
    pontosAtencao?: string | null;
    frequencia?: string | null;
    status: StatusAtivo;
    criadoPor: string;
    criadoEm: Date | string;
    atualizadoEm: Date | string;
}

export type PopOperacionalCriacao = Omit<PopOperacional, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">;
export type PopOperacionalAtualizacao = Partial<PopOperacionalCriacao>;
