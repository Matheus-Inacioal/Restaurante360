/**
 * GET /api/empresa/ponto/historico
 *
 * Retorna o histórico de registros de ponto do colaborador logado.
 * Suporta filtros: ?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto } from "@/server/auth/garantirAcessoPonto";
import { repositorioPontoPg } from "@/server/repositorios/repositorio-ponto-pg";
import { jsonOk, jsonErro } from "@/server/http/respostas";

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  try {
    const { searchParams } = new URL(req.url);
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const registros = await repositorioPontoPg.listarPorPeriodo({
      empresaId: acesso.empresaId,
      colaboradorId: acesso.colaboradorId,
      dataInicio: dataInicio ? new Date(dataInicio + "T00:00:00") : undefined,
      dataFim: dataFim ? new Date(dataFim + "T23:59:59") : undefined,
    });

    return jsonOk(registros);
  } catch (error: any) {
    console.error("[GET /api/empresa/ponto/historico] Erro:", error);
    return jsonErro("Erro ao obter histórico de ponto.", "INTERNAL_ERROR", 500);
  }
}
