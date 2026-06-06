/**
 * GET /api/empresa/ponto/saldo
 *
 * Retorna o saldo de banco de horas do colaborador logado.
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto } from "@/server/auth/garantirAcessoPonto";
import { obterSaldoAcumulado } from "@/server/servicos/servico-banco-horas";
import { repositorioBancoHorasPg } from "@/server/repositorios/repositorio-banco-horas-pg";
import { jsonOk, jsonErro } from "@/server/http/respostas";

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  try {
    const { searchParams } = new URL(req.url);
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");

    // Saldo acumulado total
    const saldoAcumulado = await obterSaldoAcumulado(
      acesso.empresaId,
      acesso.colaboradorId
    );

    // Saldo mensal (se mês/ano fornecidos)
    let saldoMensal = null;
    if (mes && ano) {
      saldoMensal = await repositorioBancoHorasPg.obterSaldoMensal(
        acesso.empresaId,
        acesso.colaboradorId,
        parseInt(mes),
        parseInt(ano)
      );
    }

    return jsonOk({
      acumulado: saldoAcumulado,
      mensal: saldoMensal,
    });
  } catch (error: any) {
    console.error("[GET /api/empresa/ponto/saldo] Erro:", error);
    return jsonErro("Erro ao obter saldo de banco de horas.", "INTERNAL_ERROR", 500);
  }
}
