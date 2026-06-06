/**
 * GET  /api/sistema/cargos — Listar cargos da empresa
 * POST /api/sistema/cargos — Criar novo cargo
 */
import { NextRequest } from "next/server";
import { obterSessao } from "@/server/auth/obterSessao";
import { jsonErro, jsonOk } from "@/server/http/respostas";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { servicoUsuarios } from "@/server/servicos/servico-usuarios";

export async function GET(req: NextRequest) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  const autor = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!autor || autor.status === "inativo") {
    return jsonErro("Acesso negado.", "FORBIDDEN", 403);
  }

  try {
    let empresaId = autor.empresaId;
    if (autor.papel === "saasAdmin") {
      const { searchParams } = new URL(req.url);
      empresaId = searchParams.get("empresaId") || "seed-empresa-demo";
    }

    if (!empresaId) {
      return jsonErro("ID da empresa é obrigatório.", "BAD_REQUEST", 400);
    }

    const cargos = await servicoUsuarios.obterCargos(empresaId);
    return jsonOk(cargos);
  } catch (error: any) {
    console.error("[GET /api/sistema/cargos] Erro:", error);
    return jsonErro("Erro ao listar cargos.", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  const autor = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!autor || autor.status === "inativo") {
    return jsonErro("Acesso negado.", "FORBIDDEN", 403);
  }

  try {
    const dados = await req.json();
    if (!dados.nome) {
      return jsonErro("Nome do cargo é obrigatório.", "BAD_REQUEST", 400);
    }

    const novoCargo = await servicoUsuarios.criarCargo(autor.empresaId!, dados.nome, dados.descricao);
    return jsonOk(novoCargo);
  } catch (error: any) {
    console.error("[POST /api/sistema/cargos] Erro:", error);
    return jsonErro(error.message || "Erro ao criar cargo.", "INTERNAL_ERROR", 500);
  }
}
