import 'server-only';
import { obterSessao, SessaoUsuario } from './obterSessao';
import { jsonErro } from '@/server/http/respostas';
import { repositorioUsuariosPg } from '@/server/repositorios/repositorio-usuarios-pg';
import { repositorioEmpresasPg } from '@/server/repositorios/repositorio-empresas-pg';

export interface ResultadoAcessoEmpresa {
  sessao: SessaoUsuario;
  empresaId: string;
}

/**
 * Garante que o chamador está autenticado e pertence a uma empresa ativa.
 *
 * Aceita os papéis: gestorCorporativo, gestorLocal, operacional
 * (saasAdmin NÃO usa esta função — usa garantirAcessoSistema)
 *
 * Fluxo:
 * 1. Valida token Firebase (Bearer)
 * 2. Busca perfil no PostgreSQL pelo UID
 * 3. Valida papel e vínculo com empresa
 * 4. Valida que a empresa existe e está ativa
 * 5. (Opcional) valida empresaIdAlvo
 */
export async function garantirAcessoEmpresa(
  req: Request,
  empresaIdAlvo?: string
): Promise<ResultadoAcessoEmpresa | Response> {
  // 1. Validar token
  const sessao = await obterSessao(req);
  if (!sessao) {
    return jsonErro('Não autorizado. Token inválido ou ausente.', 'UNAUTHORIZED', 401);
  }

  // 2. Buscar perfil completo no PostgreSQL
  const perfil = await repositorioUsuariosPg.obterPorId(sessao.uid);
  if (!perfil) {
    return jsonErro('Perfil não encontrado. Contate o administrador.', 'UNAUTHORIZED', 401);
  }

  if (perfil.status === 'inativo') {
    return jsonErro('Usuário inativo. Contate o administrador.', 'FORBIDDEN', 403);
  }

  // 3. Validar papel — saasAdmin não entra aqui
  if (perfil.papel === 'saasAdmin') {
    return jsonErro('Acesso não permitido neste portal.', 'FORBIDDEN', 403);
  }

  // 4. Validar empresaId
  const empresaId = perfil.empresaId;
  if (!empresaId) {
    return jsonErro(
      'Usuário sem vínculo com empresa. Contate o administrador.',
      'FORBIDDEN',
      403
    );
  }

  // 5. Validar empresa ativa
  const empresa = await repositorioEmpresasPg.obterPorId(empresaId);
  if (!empresa) {
    return jsonErro('Empresa não encontrada. Contate o suporte.', 'FORBIDDEN', 403);
  }
  if (empresa.status === 'SUSPENSO' || empresa.status === 'CANCELADO') {
    return jsonErro(
      'Sua empresa está temporariamente inativa. Contate o administrador.',
      'FORBIDDEN',
      403
    );
  }

  // 6. Validar empresaId alvo (se informado)
  if (empresaIdAlvo && empresaId !== empresaIdAlvo) {
    return jsonErro('Acesso negado à empresa solicitada.', 'FORBIDDEN', 403);
  }

  // Preencher sessao com dados do PostgreSQL (fallback caso claims não estejam atualizadas)
  sessao.papel = perfil.papel;
  sessao.empresaId = empresaId;
  sessao.unidadeId = perfil.unidadeId ?? undefined;

  return { sessao, empresaId };
}
