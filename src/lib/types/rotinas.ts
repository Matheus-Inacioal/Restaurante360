export type FrequenciaRotina = "diaria" | "semanal" | "mensal";

export interface Rotina {
    id: string;
    empresaId: string;
    titulo: string;
    descricao?: string;
    ativa: boolean;
    frequencia: FrequenciaRotina;
    diasSemana?: number[]; // 0=Dom ... 6=Sáb (apenas se frequencia="semanal")
    diaDoMes?: number; // 1..31 (apenas se frequencia="mensal")
    horarioPreferencial?: string; // "HH:MM" (opcional)
    responsavelPadraoId?: string; // opcional
    tipoTarefaGerada: "tarefa" | "checklist";
    checklistModelo?: { id: string; texto: string }[]; // usado se tipoTarefaGerada = "checklist"
    tags?: string[];
    criadoPor: string;
    criadoEm: string; // ISO
    atualizadoEm: string; // ISO
}

export interface GeracaoRotinaDiaria {
    id: string;
    empresaId: string;
    rotinaId: string;
    dataReferencia: string; // "YYYY-MM-DD"
    taskIdGerada: string;
    criadoEm: string; // ISO
}
