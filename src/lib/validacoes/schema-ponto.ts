/**
 * Schemas de validação Zod — Módulo de Ponto
 * Restaurante360
 *
 * Usados nas API Routes para validação de entrada.
 */
import { z } from 'zod';

// ─── Registro de Ponto ───────────────────────────────────────

export const schemaRegistroPonto = z.object({
  tipoRegistro: z.enum(['entrada', 'inicio_pausa', 'fim_pausa', 'saida'], {
    required_error: 'Tipo de registro é obrigatório.',
    invalid_type_error: 'Tipo de registro inválido.',
  }),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  origemRegistro: z.enum(['app_mobile', 'app_web', 'ajuste_gestor', 'importacao']).optional().default('app_web'),
  observacao: z.string().max(500).optional(),
});

export type SchemaRegistroPonto = z.infer<typeof schemaRegistroPonto>;

// ─── Ajuste de Ponto ─────────────────────────────────────────

export const schemaAjustePonto = z.object({
  registroPontoId: z.string().cuid({ message: 'ID do registro inválido.' }),
  horarioAjustado: z.string().datetime({ message: 'Horário ajustado inválido.' }),
  motivo: z.string().min(5, 'Motivo deve ter pelo menos 5 caracteres.').max(500),
});

export type SchemaAjustePonto = z.infer<typeof schemaAjustePonto>;

// ─── Justificativa de Ponto ──────────────────────────────────

export const schemaJustificativaPonto = z.object({
  registroPontoId: z.string().cuid().optional(),
  colaboradorId: z.string().cuid().optional(),
  dataReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD.'),
  motivo: z.string().min(5, 'Motivo deve ter pelo menos 5 caracteres.').max(1000),
  observacao: z.string().max(1000).optional(),
  anexoUrl: z.string().url().optional(),
});

export type SchemaJustificativaPonto = z.infer<typeof schemaJustificativaPonto>;

// ─── Filtros de Consulta ─────────────────────────────────────

export const schemaFiltrosPonto = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  unidadeId: z.string().cuid().optional(),
  colaboradorId: z.string().cuid().optional(),
  status: z.enum(['valido', 'recusado', 'ajustado', 'pendente']).optional(),
});

export type SchemaFiltrosPonto = z.infer<typeof schemaFiltrosPonto>;

// ─── Filtros de Relatório ────────────────────────────────────

export const schemaFiltrosRelatorio = z.object({
  tipo: z.enum(['diario', 'semanal', 'mensal'], {
    required_error: 'Tipo de relatório é obrigatório.',
  }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mes: z.coerce.number().min(1).max(12).optional(),
  ano: z.coerce.number().min(2020).max(2100).optional(),
  unidadeId: z.string().cuid().optional(),
  colaboradorId: z.string().cuid().optional(),
});

export type SchemaFiltrosRelatorio = z.infer<typeof schemaFiltrosRelatorio>;

// ─── Exportação ──────────────────────────────────────────────

export const schemaExportacao = z.object({
  formato: z.enum(['pdf', 'excel', 'csv'], {
    required_error: 'Formato de exportação é obrigatório.',
  }),
  tipo: z.enum(['diario', 'semanal', 'mensal']),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mes: z.coerce.number().min(1).max(12).optional(),
  ano: z.coerce.number().min(2020).max(2100).optional(),
  unidadeId: z.string().cuid().optional(),
  colaboradorId: z.string().cuid().optional(),
});

export type SchemaExportacao = z.infer<typeof schemaExportacao>;

// ─── Fechamento de Ponto ─────────────────────────────────────

export const schemaFechamentoPonto = z.object({
  mes: z.number().min(1).max(12),
  ano: z.number().min(2020).max(2100),
  colaboradorId: z.string().cuid().optional(),
  observacao: z.string().max(1000).optional(),
});

export type SchemaFechamentoPonto = z.infer<typeof schemaFechamentoPonto>;

// ─── Aprovação de Justificativa ──────────────────────────────

export const schemaAprovacaoJustificativa = z.object({
  justificativaId: z.string().cuid(),
  aprovado: z.boolean(),
  motivoRecusa: z.string().max(500).optional(),
});

export type SchemaAprovacaoJustificativa = z.infer<typeof schemaAprovacaoJustificativa>;
