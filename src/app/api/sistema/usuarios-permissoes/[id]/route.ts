/**
 * PUT    /api/sistema/usuarios-permissoes/[id] — Editar dados de um colaborador
 * DELETE /api/sistema/usuarios-permissoes/[id] — Desativar colaborador (soft delete)
 */
import { NextRequest } from "next/server";
import { obterSessao } from "@/server/auth/obterSessao";
import { jsonErro, jsonOk } from "@/server/http/respostas";
import { servicoUsuarios } from "@/server/servicos/servico-usuarios";

interface ContextProps {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: ContextProps) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  const { id } = params;

  try {
    const dados = await req.json();

    const usuarioAtualizado = await servicoUsuarios.atualizarUsuario(sessao.uid, id, {
      nome: dados.nome,
      papel: dados.papel,
      nivelHierarquia: dados.nivelHierarquia,
      unidadeId: dados.unidadeId,
      areaId: dados.areaId,
      funcaoId: dados.funcaoId,
      perfilAcessoId: dados.perfilAcessoId,
      cargoId: dados.cargoId,
      status: dados.status,
      unidadeIds: dados.unidadeIds
    });

    return jsonOk(usuarioAtualizado);
  } catch (error: any) {
    console.error(`[PUT /api/sistema/usuarios-permissoes/${id}] Erro:`, error);
    return jsonErro(error.message || "Erro ao atualizar colaborador.", "INTERNAL_ERROR", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: ContextProps) {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado.", "UNAUTHORIZED", 401);
  }

  const { id } = params;

  try {
    const inativado = await servicoUsuarios.desativarUsuario(sessao.uid, id);
    return jsonOk(inativado);
  } catch (error: any) {
    console.error(`[DELETE /api/sistema/usuarios-permissoes/${id}] Erro:`, error);
    return jsonErro(error.message || "Erro ao desativar colaborador.", "INTERNAL_ERROR", 500);
  }
}
