export type StatusTarefa = "pendente" | "em_progresso" | "concluida" | "atrasada";
export type TipoTarefa = "tarefa" | "checklist";

export interface ItemVerificacao {
    id: string;
    texto: string;
    concluido: boolean;
}

export interface Tarefa {
    id: string;
    empresaId: string;
    titulo: string;
    descricao?: string;
    tipo: TipoTarefa;
    status: StatusTarefa;
    prioridade: "Alta" | "Média" | "Baixa";
    responsavel?: string;
    prazo?: string; // ISO
    tags?: string[];
    itensVerificacao?: ItemVerificacao[];
    criadoPor: string;
    criadoEm: string; // ISO
    atualizadoEm: string; // ISO
}
