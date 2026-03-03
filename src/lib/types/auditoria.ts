export type TipoEventoAuditoria =
    | 'EMPRESA_CRIADA'
    | 'ACEITE_ENVIADO'
    | 'PAGAMENTO_CONFIRMADO'
    | 'COBRANCA_VENCIDA'
    | 'ASSINATURA_CANCELADA'
    | 'ASSINATURA_CRIADA'
    | 'USUARIO_CRIADO'
    | 'PROCESSO_MODIFICADO'
    | 'ACESSO_SISTEMA';

export interface LogAuditoria {
    id: string;
    empresaId?: string; // Tenant associado (se aplicável), nulo se for ação a nível de sistema global
    tipo: TipoEventoAuditoria;
    usuarioId?: string; // Quem gerou a ação (sistema, admin, job, etc)
    descricao: string;

    // Opcional: Dados extra do evento, num JSON stringified ou struct base.
    metadata?: Record<string, any>;

    criadoEm: string;
}
