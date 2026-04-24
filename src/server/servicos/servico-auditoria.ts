/**
 * Serviço de Auditoria — Restaurante360
 * Registra ações críticas no PostgreSQL de forma centralizada.
 * server-only
 */
import "server-only";
import { prisma } from "@/lib/prisma";

interface DadosAuditoria {
  usuarioId: string;
  acao: string;        // Ex: "empresa.criada", "usuario.inativado"
  entidade: string;    // Ex: "empresa", "usuario"
  entidadeId: string;
  empresaId?: string | null;
  detalhe?: Record<string, any> | null;
}

export async function registrarAuditoria(dados: DadosAuditoria): Promise<void> {
  await prisma.auditoria.create({
    data: {
      usuarioId: dados.usuarioId,
      acao: dados.acao,
      entidade: dados.entidade,
      entidadeId: dados.entidadeId,
      empresaId: dados.empresaId ?? null,
      detalhe: dados.detalhe ?? undefined,
    },
  });
}
