/**
 * Serviço de Auditoria de Ponto — Restaurante360
 *
 * Funções de conveniência para registrar auditoria em operações de ponto.
 * server-only
 */
import "server-only";
import { repositorioAuditoriaPontoPg } from "@/server/repositorios/repositorio-auditoria-ponto-pg";

/**
 * Registra auditoria para criação de registro de ponto.
 */
export async function registrarCriacao(
  empresaId: string,
  registroId: string,
  dados: Record<string, unknown>,
  responsavelId: string,
  ip?: string,
  userAgent?: string
) {
  return repositorioAuditoriaPontoPg.registrar({
    empresaId,
    registroOriginalId: registroId,
    tipoAlteracao: "criacao",
    valorNovo: dados,
    responsavelId,
    ip,
    userAgent,
  });
}

/**
 * Registra auditoria para edição/ajuste de registro de ponto.
 */
export async function registrarEdicao(
  empresaId: string,
  registroId: string,
  valorAnterior: Record<string, unknown>,
  valorNovo: Record<string, unknown>,
  motivo: string,
  responsavelId: string,
  ip?: string,
  userAgent?: string
) {
  return repositorioAuditoriaPontoPg.registrar({
    empresaId,
    registroOriginalId: registroId,
    tipoAlteracao: "ajuste",
    valorAnterior,
    valorNovo,
    motivo,
    responsavelId,
    ip,
    userAgent,
  });
}

/**
 * Registra auditoria para exclusão lógica (soft delete).
 */
export async function registrarExclusao(
  empresaId: string,
  registroId: string,
  motivo: string,
  responsavelId: string,
  ip?: string,
  userAgent?: string
) {
  return repositorioAuditoriaPontoPg.registrar({
    empresaId,
    registroOriginalId: registroId,
    tipoAlteracao: "exclusao_logica",
    motivo,
    responsavelId,
    ip,
    userAgent,
  });
}

/**
 * Registra auditoria para aprovação de justificativa.
 */
export async function registrarAprovacao(
  empresaId: string,
  registroId: string | null,
  dados: Record<string, unknown>,
  responsavelId: string,
  ip?: string,
  userAgent?: string
) {
  return repositorioAuditoriaPontoPg.registrar({
    empresaId,
    registroOriginalId: registroId,
    tipoAlteracao: "aprovacao",
    valorNovo: dados,
    responsavelId,
    ip,
    userAgent,
  });
}
