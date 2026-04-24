import 'server-only';
import { cookies } from 'next/headers';
import { verificarToken, COOKIE_SESSAO, type PayloadSessao } from './jwt';
import type { PapelUsuario } from '@/lib/tipos/identidade';

/**
 * Sessão do usuário extraída do JWT (cookie httpOnly ou header Authorization).
 */
export type SessaoUsuario = {
  uid: string;
  email?: string;
  papel?: PapelUsuario;
  empresaId?: string;
  unidadeId?: string;
};

/**
 * Extrai e valida a sessão do usuário.
 *
 * Prioridade:
 * 1. Cookie httpOnly `r360_sessao` (fluxo padrão do browser)
 * 2. Header `Authorization: Bearer <jwt>` (para chamadas programáticas)
 *
 * Retorna null se o token for inválido, expirado ou ausente.
 */
export async function obterSessao(req?: Request): Promise<SessaoUsuario | null> {
  try {
    let token: string | undefined;

    // 1. Tentar cookie (Next.js server-side)
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_SESSAO)?.value;
    } catch {
      // cookies() pode falhar fora de contexto de request (ex: middleware)
    }

    // 2. Fallback para header Authorization (se req disponível)
    if (!token && req) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split('Bearer ')[1];
      }
    }

    if (!token) {
      return null;
    }

    const payload = await verificarToken(token);
    if (!payload) {
      return null;
    }

    return {
      uid: payload.uid,
      email: payload.email,
      papel: payload.papel as PapelUsuario | undefined,
      empresaId: payload.empresaId,
      unidadeId: payload.unidadeId,
    };
  } catch (error) {
    console.error('[obterSessao] Erro ao verificar sessão:', error);
    return null;
  }
}
