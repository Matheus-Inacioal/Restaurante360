/**
 * Tipos centrais do módulo de Controle de Ponto — Restaurante360
 * Alinhados ao schema Prisma (PostgreSQL)
 */

// ─── Enums ────────────────────────────────────────────────────

export type TipoRegistroPonto = 'entrada' | 'inicio_pausa' | 'fim_pausa' | 'saida';

export type StatusRegistroPonto = 'valido' | 'recusado' | 'ajustado' | 'pendente';

export type OrigemRegistroPonto = 'app_mobile' | 'app_web' | 'ajuste_gestor' | 'importacao';

export type TipoAlteracaoPonto = 'criacao' | 'edicao' | 'exclusao_logica' | 'ajuste' | 'aprovacao';

export type TipoEscala = 'cinco_por_dois' | 'seis_por_um' | 'doze_por_trinta_seis' | 'personalizada';

export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';

export type StatusFechamento = 'aberto' | 'fechado' | 'revisao';

export type StatusJustificativa = 'pendente_aprovacao' | 'aprovada' | 'recusada';

// ─── Estado da Máquina de Jornada ─────────────────────────────

/**
 * Estados possíveis da jornada de um colaborador no dia.
 * Cada estado define qual é a próxima ação permitida.
 */
export type EstadoJornada =
  | 'sem_registro'     // Pode: entrada
  | 'trabalhando'      // Pode: inicio_pausa ou saida
  | 'em_pausa'         // Pode: fim_pausa
  | 'retornou_pausa'   // Pode: inicio_pausa ou saida
  | 'jornada_finalizada'; // Nenhuma ação permitida

/**
 * Ação que o colaborador pode tomar no estado atual
 */
export type AcaoPontoPermitida = TipoRegistroPonto;

// ─── Entidades ────────────────────────────────────────────────

export interface RegistroPonto {
  id: string;
  empresaId: string;
  unidadeId: string;
  colaboradorId: string;
  tipoRegistro: TipoRegistroPonto;
  dataReferencia: string; // ISO date
  horarioRegistro: string; // ISO datetime
  horarioServidor: string; // ISO datetime
  latitude: number | null;
  longitude: number | null;
  dentroRaioPermitido: boolean;
  distanciaMetros: number | null;
  origemRegistro: OrigemRegistroPonto;
  statusRegistro: StatusRegistroPonto;
  observacao: string | null;
  deletadoEm: string | null;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
  // Relacionamentos opcionais (quando populados)
  colaborador?: { id: string; nome: string };
  criador?: { id: string; nome: string };
}

export interface PausaPonto {
  id: string;
  empresaId: string;
  registroPontoId: string;
  colaboradorId: string;
  inicio: string;
  fim: string | null;
  duracaoMinutos: number | null;
  tipo: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface JustificativaPonto {
  id: string;
  empresaId: string;
  registroPontoId: string | null;
  colaboradorId: string;
  dataReferencia: string;
  motivo: string;
  observacao: string | null;
  anexoUrl: string | null;
  status: StatusJustificativa;
  aprovadoPor: string | null;
  aprovadoEm: string | null;
  motivoRecusa: string | null;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
  // Relacionamentos opcionais
  criador?: { id: string; nome: string };
  aprovador?: { id: string; nome: string };
}

export interface AjustePonto {
  id: string;
  empresaId: string;
  registroPontoId: string;
  horarioOriginal: string;
  horarioAjustado: string;
  motivo: string;
  criadoPor: string;
  criadoEm: string;
  // Relacionamentos opcionais
  criador?: { id: string; nome: string };
}

export interface BancoHoras {
  id: string;
  empresaId: string;
  colaboradorId: string;
  dataReferencia: string;
  totalTrabalhadoMinutos: number;
  totalPausasMinutos: number;
  atrasoMinutos: number;
  saidaAntecipadaMinutos: number;
  horaExtraMinutos: number;
  bancoPositivoMinutos: number;
  bancoNegativoMinutos: number;
  saldoFinalMinutos: number;
  jornadaPrevistaMinutos: number;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FechamentoPonto {
  id: string;
  empresaId: string;
  colaboradorId: string;
  mes: number;
  ano: number;
  status: StatusFechamento;
  totalTrabalhadoMinutos: number;
  totalHoraExtraMinutos: number;
  totalAtrasoMinutos: number;
  totalFaltas: number;
  saldoBancoMinutos: number;
  diasTrabalhados: number;
  fechadoPor: string | null;
  fechadoEm: string | null;
  observacao: string | null;
  criadoEm: string;
  atualizadoEm: string;
  // Relacionamentos opcionais
  colaborador?: { id: string; nome: string };
  fechador?: { id: string; nome: string };
}

export interface AuditoriaPonto {
  id: string;
  empresaId: string;
  registroOriginalId: string | null;
  tipoAlteracao: TipoAlteracaoPonto;
  valorAnterior: Record<string, unknown> | null;
  valorNovo: Record<string, unknown> | null;
  motivo: string | null;
  responsavelId: string;
  dataAlteracao: string;
  ip: string | null;
  userAgent: string | null;
  // Relacionamentos opcionais
  responsavel?: { id: string; nome: string };
}

export interface EscalaTrabalho {
  id: string;
  empresaId: string;
  unidadeId: string | null;
  nome: string;
  tipoEscala: TipoEscala;
  jornadaDiariaMinutos: number;
  intervaloAlmocoMinutos: number;
  toleranciaAtrasoMinutos: number;
  toleranciaSaidaMinutos: number;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface JornadaPrevista {
  id: string;
  empresaId: string;
  colaboradorId: string;
  escalaId: string;
  diaSemana: DiaSemana;
  horarioEntrada: string;
  horarioSaida: string;
  horarioAlmocoInicio: string | null;
  horarioAlmocoFim: string | null;
  folga: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// ─── DTOs (Dados de entrada/saída) ────────────────────────────

/** Dados para registrar uma batida */
export interface DadosRegistroPonto {
  tipoRegistro: TipoRegistroPonto;
  latitude?: number;
  longitude?: number;
  origemRegistro?: OrigemRegistroPonto;
  observacao?: string;
}

/** Resultado da validação de geolocalização */
export interface ResultadoGeolocalizacao {
  dentroRaio: boolean;
  distanciaMetros: number;
  latitudeUsuario: number;
  longitudeUsuario: number;
  latitudeUnidade: number;
  longitudeUnidade: number;
  raioPermitidoMetros: number;
}

/** Resultado do cálculo de jornada diária */
export interface ResultadoCalculoJornada {
  totalTrabalhadoMinutos: number;
  totalPausasMinutos: number;
  atrasoMinutos: number;
  saidaAntecipadaMinutos: number;
  horaExtraMinutos: number;
  bancoPositivoMinutos: number;
  bancoNegativoMinutos: number;
  saldoFinalMinutos: number;
  jornadaPrevistaMinutos: number;
}

/** Estado atual da jornada (retornado pela API) */
export interface EstadoJornadaAtual {
  estado: EstadoJornada;
  acaoPermitida: AcaoPontoPermitida | null;
  registrosDoDia: RegistroPonto[];
  pausaAberta: PausaPonto | null;
  horasTrabalhadasAteAgora: number; // minutos
}

/** Filtros da tela do gestor */
export interface FiltrosPontoGestor {
  data?: string;         // YYYY-MM-DD
  unidadeId?: string;
  colaboradorId?: string;
  status?: StatusRegistroPonto;
}

/** Linha da planilha do gestor */
export interface LinhaPontoGestor {
  colaboradorId: string;
  colaboradorNome: string;
  entradaPrevista: string | null;
  entradaRealizada: string | null;
  pausaInicio: string | null;
  pausaFim: string | null;
  saidaPrevista: string | null;
  saidaRealizada: string | null;
  atrasoMinutos: number;
  horaExtraMinutos: number;
  bancoHorasMinutos: number;
  saldoFinalMinutos: number;
  status: StatusRegistroPonto | 'falta' | 'folga';
  justificativa: string | null;
}

/** Dados de relatório de ponto */
export interface RelatoriosPonto {
  periodo: { inicio: string; fim: string };
  tipo: 'diario' | 'semanal' | 'mensal';
  totalHorasMinutos: number;
  totalHorasExtrasMinutos: number;
  totalFaltas: number;
  totalAtrasos: number;
  bancoPositivoMinutos: number;
  bancoNegativoMinutos: number;
  saldoFinalMinutos: number;
  linhas: LinhaPontoGestor[];
}

// ─── Helpers de formatação ────────────────────────────────────

/** Converte minutos para formato "Xh Ym" */
export function formatarMinutosParaHoras(minutos: number): string {
  const sinal = minutos < 0 ? '-' : '';
  const abs = Math.abs(minutos);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sinal}${m}min`;
  if (m === 0) return `${sinal}${h}h`;
  return `${sinal}${h}h ${m}min`;
}

/** Labels em português para os tipos de registro */
export const LABELS_TIPO_REGISTRO: Record<TipoRegistroPonto, string> = {
  entrada: 'Entrada',
  inicio_pausa: 'Início da Pausa',
  fim_pausa: 'Fim da Pausa',
  saida: 'Saída',
};

/** Labels em português para os status de registro */
export const LABELS_STATUS_REGISTRO: Record<StatusRegistroPonto, string> = {
  valido: 'Válido',
  recusado: 'Recusado',
  ajustado: 'Ajustado',
  pendente: 'Pendente',
};

/** Labels em português para os estados da jornada */
export const LABELS_ESTADO_JORNADA: Record<EstadoJornada, string> = {
  sem_registro: 'Sem Registro',
  trabalhando: 'Trabalhando',
  em_pausa: 'Em Pausa',
  retornou_pausa: 'Trabalhando',
  jornada_finalizada: 'Jornada Finalizada',
};

/** Cores dos status para badges */
export const CORES_STATUS_REGISTRO: Record<StatusRegistroPonto | 'falta' | 'folga', string> = {
  valido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  recusado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  ajustado: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  pendente: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  falta: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  folga: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
