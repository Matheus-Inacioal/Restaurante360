export type StatusEmpresa = 'TRIAL_ATIVO' | 'ATIVO' | 'GRACE' | 'SUSPENSO' | 'CANCELADO';
export type CicloPagamento = 'MENSAL' | 'ANUAL' | 'SEMESTRAL';
export type FormaPagamento = 'CARTAO' | 'BOLETO' | 'PIX' | 'UNDEFINED';

export interface Plano {
    id: string;
    nome: string; // Ex: Starter, Pro, Enterprise
    descricao: string;
    valorMensal: number;
    valorAnual: number;
    features: string[];
    ativo: boolean;
    criadoEm: string;
    atualizadoEm: string;
}

export interface EmpresaAtualizada {
    id: string;
    nome: string;
    cnpj: string;
    responsavelNome: string;
    responsavelEmail: string;
    whatsappResponsavel: string; // Opcional no legado, agora fixado como whatsappResponsavel

    // Status SaaS
    status: StatusEmpresa;

    // Info Financeira
    planoId?: string;
    planoNome?: string;
    cicloPagamento?: CicloPagamento;
    valorAtual?: number;

    // Trial e Faturamento
    diasTrial?: number;
    trialInicio?: string;
    trialFim?: string;
    vencimentoPrimeiraCobrancaEm?: string;

    // Asaas Integrations
    asaasCustomerId?: string;
    asaasSubscriptionId?: string;

    criadoEm: string;
    atualizadoEm: string;
}

export type StatusAceite = 'PENDENTE' | 'ACEITO' | 'EXPIRADO';

export interface AceiteAssinatura {
    id: string; // id único usado no token da URL
    empresaId: string;
    planoId: string;
    ciclo: CicloPagamento;
    valor: number;

    status: StatusAceite;
    expiraEm: string;

    // Metadados do Locatário
    diasTrial?: number;
    vencimentoPrimeiraCobrancaEm?: string;
    responsavelNome?: string;
    responsavelEmail?: string;
    whatsappResponsavel?: string;
    cnpj?: string;

    // Quando aceito
    aceitoEm?: string;
    aceitoPorCanal?: 'WHATSAPP' | 'EMAIL' | 'LINK_DIRETO';
    formaPagamentoEscolhida?: FormaPagamento;

    // Retorno Asaas
    asaasCustomerId?: string;
    asaasSubscriptionId?: string;

    criadoEm: string;
}

export type StatusAssinatura = 'ACTIVE' | 'OVERDUE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELED';

export interface AssinaturaAsaas {
    id: string;
    empresaId: string;
    asaasSubscriptionId: string;
    status: StatusAssinatura;
    valor: number;
    ciclo: CicloPagamento;
    formaPagamento: FormaPagamento;

    proximoVencimento?: string;
    inicioAssinatura: string;

    criadaEm: string;
    atualizadaEm: string;
}

export type StatusCobranca = 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';

export interface Cobranca {
    id: string;
    empresaId: string;
    assinaturaId?: string; // ID interno
    asaasPaymentId: string;
    asaasSubscriptionId?: string;

    valor: number;
    valorLiquido?: number;
    vencimento: string;
    status: StatusCobranca;
    formaPagamento: FormaPagamento;

    // URLs para envio
    invoiceUrl?: string; // Boleto ou tela Asaas
    bankSlipUrl?: string; // PDF
    pixPayload?: string; // QR Code/Copia e Cola

    pagaEm?: string;
    criadaEm: string;
    atualizadaEm: string;
}
