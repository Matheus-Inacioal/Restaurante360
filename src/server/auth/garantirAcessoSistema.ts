import 'server-only';
import { obterSessao, SessaoUsuario } from './obterSessao';
import { jsonErro } from '@/server/http/respostas';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';

/**
 * Garante que o chamador é um saasAdmin autenticado.
 * Busca o perfil no PostgreSQL para validar.
 */
export async function garantirAcessoSistema(
  req: Request
): Promise<{ sessao: SessaoUsuario } | Response> {
  const sessao = await obterSessao(req);

  if (!sessao) {
    return jsonErro('Não autorizado. Token inválido ou ausente.', 'UNAUTHORIZED', 401);
  }

  // Buscar no PostgreSQL para garantir que é saasAdmin
  const perfil = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!perfil || perfil.papel !== 'saasAdmin') {
    return jsonErro('Acesso restrito a administradores do sistema.', 'FORBIDDEN', 403);
  }

  if (perfil.status === 'inativo') {
    return jsonErro('Usuário inativo.', 'FORBIDDEN', 403);
  }

  sessao.papel = 'saasAdmin';
  return { sessao };
}
