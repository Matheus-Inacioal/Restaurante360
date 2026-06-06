/**
 * GET  /api/sistema/usuarios-permissoes — Listar usuários corporativos
 * POST /api/sistema/usuarios-permissoes — Criar novo colaborador corporativo
 */
import { NextRequest, NextResponse } from "next/server";
import { obterSessao } from "@/server/auth/obterSessao";
import { jsonErro, jsonOk } from "@/server/http/respostas";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { servicoUsuarios } from "@/server/servicos/servico-usuarios";

export async function GET(req: NextRequest) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado. Token ausente ou expirado.", "UNAUTHORIZED", 401);
  }

  const autor = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!autor || autor.status === "inativo") {
    return jsonErro("Acesso negado. Usuário inativo ou inexistente.", "FORBIDDEN", 403);
  }

  try {
    // Resolver qual empresa filtrar
    let empresaId = autor.empresaId;
    if (autor.papel === "saasAdmin") {
      // Se for saasAdmin, pode gerenciar a empresa demo ou passar via query string
      const { searchParams } = new URL(req.url);
      empresaId = searchParams.get("empresaId") || "seed-empresa-demo";
    }

    if (!empresaId) {
      return jsonErro("ID da empresa não especificado.", "BAD_REQUEST", 400);
    }

    // Se for Gestor Local, ele vê apenas os colaboradores da sua unidade
    let usuarios;
    if (autor.nivelHierarquia === "GESTOR_LOCAL" && autor.unidadeId) {
      usuarios = await repositorioUsuariosPg.listarPorUnidade(autor.unidadeId);
    } else {
      usuarios = await repositorioUsuariosPg.listarPorEmpresa(empresaId);
    }

    return jsonOk(usuarios);
  } catch (error: any) {
    console.error("[GET /api/sistema/usuarios-permissoes] Erro:", error);
    return jsonErro("Erro ao carregar lista de usuários.", "INTERNAL_ERROR", 500);
  }
}

export async function POST(req: NextRequest) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  try {
    const dados = await req.json();

    // Validação de entrada básica
    if (!dados.email || !dados.nome || !dados.nivelHierarquia || !dados.papel) {
      return jsonErro("Campos obrigatórios ausentes (email, nome, papel, nivelHierarquia).", "BAD_REQUEST", 400);
    }

    const novoUsuario = await servicoUsuarios.criarUsuario(sessao.uid, {
      email: dados.email,
      nome: dados.nome,
      papel: dados.papel,
      nivelHierarquia: dados.nivelHierarquia,
      unidadeId: dados.unidadeId || null,
      areaId: dados.areaId || null,
      funcaoId: dados.funcaoId || null,
      perfilAcessoId: dados.perfilAcessoId || null,
      cargoId: dados.cargoId || null,
      unidadeIds: dados.unidadeIds || []
    });

    return jsonOk(novoUsuario);
  } catch (error: any) {
    console.error("[POST /api/sistema/usuarios-permissoes] Erro:", error);
    return jsonErro(error.message || "Erro ao criar colaborador.", "INTERNAL_ERROR", 500);
  }
}
