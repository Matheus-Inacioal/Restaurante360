import 'server-only';
import { adminAuth } from '@/server/firebase/admin';
import type { PapelUsuario } from '@/lib/tipos/identidade';

/**
 * Sessão do usuário extraída do ID Token do Firebase Auth.
 * As custom claims (papel, empresaId, unidadeId) são definidas
 * via Firebase Admin após criação/atualização do usuário.
 */
export type SessaoUsuario = {
  uid: string;
  email?: string;
  papel?: PapelUsuario;
  empresaId?: string;
  unidadeId?: string;
};

/**
 * Extrai e valida a sessão a partir do Bearer Token no header Authorization.
 * Retorna null se o token for inválido ou ausente.
 */
export async function obterSessao(req: Request): Promise<SessaoUsuario | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      papel: decodedToken.papel as PapelUsuario | undefined,
      empresaId: decodedToken.empresaId,
      unidadeId: decodedToken.unidadeId,
    };
  } catch (error) {
    console.error('[obterSessao] Erro ao verificar token:', error);
    return null;
  }
}
