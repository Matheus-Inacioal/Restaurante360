/**
 * GET /api/empresa/ponto/gestao
 *
 * Retorna a planilha de ponto do gestor (lista de colaboradores e suas batidas).
 * Apenas gestores podem acessar.
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto, ehGestorPonto } from "@/server/auth/garantirAcessoPonto";
import { gerarRelatorioDiario } from "@/server/servicos/servico-relatorios-ponto";
import { jsonOk, jsonErro } from "@/server/http/respostas";

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  if (!ehGestorPonto(acesso.papel)) {
    return jsonErro("Apenas gestores podem acessar o controle de ponto.", "UNAUTHORIZED", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const data = searchParams.get("data") ?? new Date().toISOString().split("T")[0];
    const unidadeId = searchParams.get("unidadeId") ?? acesso.unidadeId ?? undefined;
    const colaboradorId = searchParams.get("colaboradorId") ?? undefined;

    if (!unidadeId) {
      return jsonErro("Unidade é obrigatória para o controle de ponto.", "VALIDATION_ERROR", 400);
    }

    const relatorio = await gerarRelatorioDiario({
      empresaId: acesso.empresaId,
      unidadeId,
      colaboradorId,
      data,
    });

    return jsonOk(relatorio);
  } catch (error: any) {
    console.error("[GET /api/empresa/ponto/gestao] Erro:", error);
    return jsonErro("Erro ao obter controle de ponto.", "INTERNAL_ERROR", 500);
  }
}
