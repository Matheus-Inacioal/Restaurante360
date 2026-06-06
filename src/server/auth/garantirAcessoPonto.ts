/**
 * Guard de Acesso para APIs de Ponto — Restaurante360
 *
 * Valida autenticação, empresa ativa, papel autorizado e escopo de acesso.
 * server-only
 */
import "server-only";
import { obterSessao, type SessaoUsuario } from "./obterSessao";
import { jsonErro } from "@/server/http/respostas";
import { repositorioUsuariosPg } from "@/server/repositorios/repositorio-usuarios-pg";
import { repositorioEmpresasPg } from "@/server/repositorios/repositorio-empresas-pg";
import type { PapelUsuario } from "@/lib/tipos/identidade";

export interface ResultadoAcessoPonto {
  sessao: SessaoUsuario;
  empresaId: string;
  unidadeId: string | null;
  colaboradorId: string;
  papel: PapelUsuario;
}

/**
 * Garante acesso às APIs de ponto.
 *
 * - Colaborador: só acessa próprio ponto
 * - Gestor Local: acessa ponto de sua unidade
 * - Gestor Corporativo: acessa ponto de todas as unidades da empresa
 * - saasAdmin: não tem acesso a APIs de ponto
 */
export async function garantirAcessoPonto(
  req: Request,
  /** Se fornecido, valida que o colaborador alvo pertence à mesma empresa/unidade */
  colaboradorAlvoId?: string
): Promise<ResultadoAcessoPonto | Response> {
  // 1. Validar token
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro("Não autorizado. Token inválido ou ausente.", "UNAUTHORIZED", 401);
  }

  // 2. Buscar perfil completo
  const perfil = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!perfil) {
    return jsonErro("Perfil não encontrado. Contate o administrador.", "UNAUTHORIZED", 401);
  }

  if (perfil.status === "inativo") {
    return jsonErro("Usuário inativo. Contate o administrador.", "UNAUTHORIZED", 403);
  }

  // 3. saasAdmin não usa ponto
  if (perfil.papel === "saasAdmin") {
    return jsonErro("Administradores SaaS não possuem controle de ponto.", "UNAUTHORIZED", 403);
  }

  // 4. Validar empresa
  const empresaId = perfil.empresaId;
  if (!empresaId) {
    return jsonErro("Usuário sem vínculo com empresa.", "UNAUTHORIZED", 403);
  }

  const empresa = await repositorioEmpresasPg.obterPorId(empresaId);
  if (!empresa) {
    return jsonErro("Empresa não encontrada.", "UNAUTHORIZED", 403);
  }
  if (empresa.status === "SUSPENSO" || empresa.status === "CANCELADO") {
    return jsonErro("Empresa temporariamente inativa.", "UNAUTHORIZED", 403);
  }

  // 5. Colaborador só acessa próprio ponto
  if (perfil.papel === "operacional" && colaboradorAlvoId && colaboradorAlvoId !== sessao.uid) {
    return jsonErro("Colaboradores só podem acessar o próprio ponto.", "UNAUTHORIZED", 403);
  }

  // 6. Gestor local só acessa unidade vinculada
  if (perfil.papel === "gestorLocal" && colaboradorAlvoId && colaboradorAlvoId !== sessao.uid) {
    // Verificar se o colaborador alvo pertence à mesma unidade
    const colaboradorAlvo = await repositorioUsuariosPg.obterPorId(colaboradorAlvoId);
    if (!colaboradorAlvo || colaboradorAlvo.unidadeId !== perfil.unidadeId) {
      return jsonErro(
        "Gestor local só pode acessar ponto de colaboradores da sua unidade.",
        "UNAUTHORIZED",
        403
      );
    }
  }

  // Atualizar sessão com dados do PostgreSQL
  sessao.papel = perfil.papel;
  sessao.empresaId = empresaId;
  sessao.unidadeId = perfil.unidadeId ?? undefined;

  return {
    sessao,
    empresaId,
    unidadeId: perfil.unidadeId ?? null,
    colaboradorId: sessao.uid,
    papel: perfil.papel,
  };
}

/**
 * Verifica se o usuário tem permissão de gestor para operações de ponto.
 */
export function ehGestorPonto(papel: PapelUsuario): boolean {
  return papel === "gestorCorporativo" || papel === "gestorLocal";
}
