/**
 * GET /api/sistema/usuarios-permissoes/historico — Obter logs de auditoria de permissões da empresa
 */
import { NextRequest } from "next/server";
import { obterSessao } from "@/server/auth/obterSessao";
import { jsonErro, jsonOk } from "@/server/http/respostas";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { servicoAuditoriaPermissoes } from "@/server/servicos/servico-auditoria-permissoes";

export async function GET(req: NextRequest) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  const autor = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!autor || autor.status === "inativo") {
    return jsonErro("Acesso negado. Usuário inativo ou inexistente.", "FORBIDDEN", 403);
  }

  try {
    // Resolver qual empresa filtrar
    let empresaId = autor.empresaId;
    if (autor.papel === "saasAdmin") {
      const { searchParams } = new URL(req.url);
      empresaId = searchParams.get("empresaId") || "seed-empresa-demo";
    }

    if (!empresaId) {
      return jsonErro("ID da empresa não especificado.", "BAD_REQUEST", 400);
    }

    // Opcional: filtrar por um usuário específico
    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get("usuarioId") || undefined;

    const logs = await servicoAuditoriaPermissoes.obterHistorico(empresaId, usuarioId);

    return jsonOk(logs);
  } catch (error: any) {
    console.error("[GET /api/sistema/usuarios-permissoes/historico] Erro:", error);
    return jsonErro("Erro ao carregar histórico de auditoria.", "INTERNAL_ERROR", 500);
  }
}
