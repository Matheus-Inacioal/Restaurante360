import type { StatusAtivo } from "@prisma/client";

export interface EtapaChecklist {
    ordem: number;
    texto: string;
    concluido: boolean;
    fotoUrl?: string;
}

export interface ChecklistOperacional {
    id: string;
    empresaId: string;
    unidadeId?: string | null;
    nome: string;
    tipo?: string | null;
    frequencia?: string | null;
    setor?: string | null;
    etapas?: EtapaChecklist[] | null;
    responsavel?: string | null;
    prazo?: Date | string | null;
    popRelacionadoId?: string | null;
    exigeFoto: boolean;
    status: StatusAtivo;
    criadoPor: string;
    criadoEm: Date | string;
    atualizadoEm: Date | string;
}

export type ChecklistOperacionalCriacao = Omit<ChecklistOperacional, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor">;
export type ChecklistOperacionalAtualizacao = Partial<ChecklistOperacionalCriacao>;
