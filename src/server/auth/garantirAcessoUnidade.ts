import 'server-only';
import { obterSessao, SessaoUsuario } from './obterSessao';
import { jsonErro } from '@/server/http/respostas';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';

export interface ResultadoAcessoUnidade {
  sessao: SessaoUsuario;
  empresaId: string;
  unidadeId: string;
}

/**
 * Garante que o chamador é gestorLocal ou operacional vinculado a uma unidade.
 * Para rotas que precisam do contexto específico de unidade.
 *
 * @param unidadeIdAlvo (opcional) — valida que o acesso é à unidade correta
 */
export async function garantirAcessoUnidade(
  req: Request,
  unidadeIdAlvo?: string
): Promise<ResultadoAcessoUnidade | Response> {
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro('Não autorizado. Token inválido ou ausente.', 'UNAUTHORIZED', 401);
  }

  const perfil = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!perfil || perfil.status === 'inativo') {
    return jsonErro('Perfil inativo ou não encontrado.', 'FORBIDDEN', 403);
  }

  if (!['gestorLocal', 'operacional'].includes(perfil.papel)) {
    return jsonErro('Acesso restrito a gestores locais e operacionais.', 'FORBIDDEN', 403);
  }

  const unidadeId = perfil.unidadeId;
  if (!unidadeId) {
    return jsonErro('Usuário sem vínculo com unidade.', 'FORBIDDEN', 403);
  }

  if (unidadeIdAlvo && unidadeId !== unidadeIdAlvo) {
    return jsonErro('Acesso negado à unidade solicitada.', 'FORBIDDEN', 403);
  }

  sessao.papel = perfil.papel;
  sessao.empresaId = perfil.empresaId ?? undefined;
  sessao.unidadeId = unidadeId;

  return { sessao, empresaId: perfil.empresaId!, unidadeId };
}
