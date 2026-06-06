/**
 * POST /api/empresa/ponto/justificativas — Registrar justificativa
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto } from "@/server/auth/garantirAcessoPonto";
import { repositorioPontoPg } from "@/server/repositorios/repositorio-ponto-pg";
import { schemaJustificativaPonto } from "@/lib/validacoes/schema-ponto";
import { jsonOk, jsonErro, mapearZodError } from "@/server/http/respostas";

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  try {
    const body = await req.json();
    const validacao = schemaJustificativaPonto.safeParse(body);
    if (!validacao.success) return mapearZodError(validacao.error);

    const dados = validacao.data;

    const justificativa = await repositorioPontoPg.criarJustificativa({
      empresaId: acesso.empresaId,
      registroPontoId: dados.registroPontoId,
      colaboradorId: dados.colaboradorId ?? acesso.colaboradorId,
      dataReferencia: new Date(dados.dataReferencia + "T00:00:00"),
      motivo: dados.motivo,
      observacao: dados.observacao,
      anexoUrl: dados.anexoUrl,
      criadoPor: acesso.colaboradorId,
    });

    return jsonOk({
      mensagem: "Justificativa registrada com sucesso. Aguardando aprovação.",
      justificativa,
    });
  } catch (error: any) {
    console.error("[POST /api/empresa/ponto/justificativas] Erro:", error);
    return jsonErro("Erro ao registrar justificativa.", "INTERNAL_ERROR", 500);
  }
}
