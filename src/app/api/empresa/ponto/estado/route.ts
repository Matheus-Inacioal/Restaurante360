/**
 * GET /api/empresa/ponto/estado
 *
 * Retorna o estado atual da jornada do colaborador logado.
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto } from "@/server/auth/garantirAcessoPonto";
import { obterEstadoJornadaAtual } from "@/server/servicos/servico-registro-ponto";
import { jsonOk, jsonErro } from "@/server/http/respostas";

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  try {
    const estado = await obterEstadoJornadaAtual(
      acesso.empresaId,
      acesso.colaboradorId
    );

    return jsonOk(estado);
  } catch (error: any) {
    console.error("[GET /api/empresa/ponto/estado] Erro:", error);
    return jsonErro("Erro ao obter estado da jornada.", "INTERNAL_ERROR", 500);
  }
}
