/**
 * POST /api/empresa/ponto/registrar
 *
 * Registra uma batida de ponto (entrada, início/fim de pausa, saída).
 * Valida geolocalização e sequência da jornada.
 */
import { NextRequest, NextResponse } from "next/server";
import { garantirAcessoPonto } from "@/server/auth/garantirAcessoPonto";
import { registrarPonto } from "@/server/servicos/servico-registro-ponto";
import { processarDia } from "@/server/servicos/servico-banco-horas";
import { schemaRegistroPonto } from "@/lib/validacoes/schema-ponto";
import { jsonOk, jsonErro, mapearZodError } from "@/server/http/respostas";

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  try {
    const body = await req.json();
    const validacao = schemaRegistroPonto.safeParse(body);

    if (!validacao.success) {
      return mapearZodError(validacao.error);
    }

    const { tipoRegistro, latitude, longitude, origemRegistro, observacao } = validacao.data;

    // Extrair IP e User-Agent para auditoria
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const resultado = await registrarPonto({
      empresaId: acesso.empresaId,
      unidadeId: acesso.unidadeId ?? "",
      colaboradorId: acesso.colaboradorId,
      tipoRegistro: tipoRegistro as any,
      latitude,
      longitude,
      origemRegistro: origemRegistro as any,
      observacao,
      ip,
      userAgent,
    });

    if (!resultado.sucesso) {
      return jsonErro(resultado.mensagem, "VALIDATION_ERROR", 400);
    }

    // Processar banco de horas se for saída
    if (tipoRegistro === "saida") {
      const dataRef = new Date();
      const dataReferencia = new Date(dataRef.getFullYear(), dataRef.getMonth(), dataRef.getDate());
      await processarDia(acesso.empresaId, acesso.colaboradorId, dataReferencia);
    }

    return jsonOk({
      mensagem: resultado.mensagem,
      registro: resultado.registro,
      estadoAtual: resultado.estadoAtual,
    });
  } catch (error: any) {
    console.error("[POST /api/empresa/ponto/registrar] Erro:", error);
    return jsonErro("Erro ao registrar ponto.", "INTERNAL_ERROR", 500);
  }
}
