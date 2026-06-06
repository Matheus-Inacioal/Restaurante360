/**
 * GET /api/empresa/ponto/relatorios — Gerar relatório de ponto
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto, ehGestorPonto } from "@/server/auth/garantirAcessoPonto";
import {
  gerarRelatorioDiario,
  gerarRelatorioSemanal,
  gerarRelatorioMensal,
} from "@/server/servicos/servico-relatorios-ponto";
import { jsonOk, jsonErro } from "@/server/http/respostas";

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  if (!ehGestorPonto(acesso.papel)) {
    return jsonErro("Apenas gestores podem acessar relatórios.", "UNAUTHORIZED", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo") ?? "diario";
    const data = searchParams.get("data") ?? new Date().toISOString().split("T")[0];
    const mes = parseInt(searchParams.get("mes") ?? String(new Date().getMonth() + 1));
    const ano = parseInt(searchParams.get("ano") ?? String(new Date().getFullYear()));
    const unidadeId = searchParams.get("unidadeId") ?? acesso.unidadeId ?? undefined;
    const colaboradorId = searchParams.get("colaboradorId") ?? undefined;

    let relatorio;

    switch (tipo) {
      case "diario":
        relatorio = await gerarRelatorioDiario({
          empresaId: acesso.empresaId,
          unidadeId,
          colaboradorId,
          data,
        });
        break;

      case "semanal":
        relatorio = await gerarRelatorioSemanal({
          empresaId: acesso.empresaId,
          unidadeId,
          colaboradorId,
          data,
        });
        break;

      case "mensal":
        relatorio = await gerarRelatorioMensal({
          empresaId: acesso.empresaId,
          unidadeId,
          colaboradorId,
          mes,
          ano,
        });
        break;

      default:
        return jsonErro("Tipo de relatório inválido. Use: diario, semanal ou mensal.", "VALIDATION_ERROR", 400);
    }

    return jsonOk(relatorio);
  } catch (error: any) {
    console.error("[GET /api/empresa/ponto/relatorios] Erro:", error);
    return jsonErro("Erro ao gerar relatório.", "INTERNAL_ERROR", 500);
  }
}
