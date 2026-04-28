export interface OcorrenciaOperacional {
    id: string;
    empresaId: string;
    unidadeId?: string | null;
    tipo: string;
    item: string;
    quantidade?: number | null;
    descricao?: string | null;
    setor?: string | null;
    responsavel?: string | null;
    foto?: string | null;
    gravidade?: 'baixa' | 'media' | 'alta' | 'critica' | string | null;
    status: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada' | string;
    geraBaixaEstoque: boolean;
    baixaEstoqueAprovada: boolean;
    observacaoGestor?: string | null;
    criadoPor: string;
    criadoEm: Date | string;
    atualizadoEm: Date | string;
}

export type OcorrenciaOperacionalCriacao = Omit<OcorrenciaOperacional, "id" | "criadoEm" | "atualizadoEm" | "empresaId" | "criadoPor" | "baixaEstoqueAprovada">;
export type OcorrenciaOperacionalAtualizacao = Partial<OcorrenciaOperacionalCriacao> & { baixaEstoqueAprovada?: boolean; observacaoGestor?: string };
