/**
 * POST /api/empresa/ponto/ajustes — Registrar ajuste de ponto (gestor)
 * GET  /api/empresa/ponto/ajustes — Listar ajustes
 */
import { NextRequest } from "next/server";
import { garantirAcessoPonto, ehGestorPonto } from "@/server/auth/garantirAcessoPonto";
import { repositorioPontoPg } from "@/server/repositorios/repositorio-ponto-pg";
import { registrarEdicao } from "@/server/servicos/servico-auditoria-ponto";
import { schemaAjustePonto } from "@/lib/validacoes/schema-ponto";
import { jsonOk, jsonErro, mapearZodError } from "@/server/http/respostas";

export async function POST(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  if (!ehGestorPonto(acesso.papel)) {
    return jsonErro("Apenas gestores podem ajustar pontos.", "UNAUTHORIZED", 403);
  }

  try {
    const body = await req.json();
    const validacao = schemaAjustePonto.safeParse(body);
    if (!validacao.success) return mapearZodError(validacao.error);

    const { registroPontoId, horarioAjustado, motivo } = validacao.data;

    // Obter registro original
    const registroOriginal = await repositorioPontoPg.obterPorId(registroPontoId);
    if (!registroOriginal) {
      return jsonErro("Registro de ponto não encontrado.", "NOT_FOUND", 404);
    }

    // Verificar se o registro pertence à mesma empresa
    if (registroOriginal.empresaId !== acesso.empresaId) {
      return jsonErro("Acesso negado a este registro.", "UNAUTHORIZED", 403);
    }

    // Criar ajuste
    const ajuste = await repositorioPontoPg.criarAjuste({
      empresaId: acesso.empresaId,
      registroPontoId,
      horarioOriginal: registroOriginal.horarioRegistro,
      horarioAjustado: new Date(horarioAjustado),
      motivo,
      criadoPor: acesso.colaboradorId,
    });

    // Atualizar o registro original
    await repositorioPontoPg.atualizarHorario(registroPontoId, new Date(horarioAjustado));

    // Registrar auditoria
    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const userAgent = req.headers.get("user-agent") ?? undefined;
    await registrarEdicao(
      acesso.empresaId,
      registroPontoId,
      { horarioRegistro: registroOriginal.horarioRegistro.toISOString() },
      { horarioRegistro: horarioAjustado, motivo },
      motivo,
      acesso.colaboradorId,
      ip,
      userAgent
    );

    return jsonOk({ mensagem: "Ajuste registrado com sucesso.", ajuste });
  } catch (error: any) {
    console.error("[POST /api/empresa/ponto/ajustes] Erro:", error);
    return jsonErro("Erro ao registrar ajuste.", "INTERNAL_ERROR", 500);
  }
}

export async function GET(req: NextRequest) {
  const acesso = await garantirAcessoPonto(req);
  if (acesso instanceof Response) return acesso;

  if (!ehGestorPonto(acesso.papel)) {
    return jsonErro("Apenas gestores podem visualizar ajustes.", "UNAUTHORIZED", 403);
  }

  try {
    // Listar justificativas pendentes como proxy de ajustes pendentes
    const pendentes = await repositorioPontoPg.listarJustificativasPendentes(acesso.empresaId);
    return jsonOk(pendentes);
  } catch (error: any) {
    console.error("[GET /api/empresa/ponto/ajustes] Erro:", error);
    return jsonErro("Erro ao listar ajustes.", "INTERNAL_ERROR", 500);
  }
}
