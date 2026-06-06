/**
 * GET /api/empresa/ponto/auditoria — Consultar logs de auditoria de ponto
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto, ehGestorPonto } from "@/server/auth/garantirAcessoPonto";
import { repositorioAuditoriaPontoPg } from "@/server/repositorios/repositorio-auditoria-ponto-pg";
import { jsonOk, jsonErro } from "@/server/http/respostas";

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  if (!ehGestorPonto(acesso.papel)) {
    return jsonErro("Apenas gestores podem acessar a auditoria.", "UNAUTHORIZED", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const registroId = searchParams.get("registroId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    // Se registroId fornecido, listar auditoria de um registro específico
    if (registroId) {
      const logs = await repositorioAuditoriaPontoPg.listarPorRegistro(registroId);
      return jsonOk(logs);
    }

    // Senão, listar por período
    const inicio = dataInicio
      ? new Date(dataInicio + "T00:00:00")
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const fim = dataFim
      ? new Date(dataFim + "T23:59:59")
      : new Date();

    const logs = await repositorioAuditoriaPontoPg.listarPorPeriodo(
      acesso.empresaId,
      inicio,
      fim
    );

    return jsonOk(logs);
  } catch (error: any) {
    console.error("[GET /api/empresa/ponto/auditoria] Erro:", error);
    return jsonErro("Erro ao consultar auditoria.", "INTERNAL_ERROR", 500);
  }
}
