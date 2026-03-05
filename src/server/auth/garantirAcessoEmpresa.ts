import 'server-only';
import { obterSessao, SessaoUsuario } from './obterSessao';
import { jsonErro } from '@/server/http/respostas';

/**
 * Garante que o chamador está autenticado e pertence à empresaId alvo.
 * @param req O Request originário.
 * @param empresaIdAlvo (opcional) O ID da empresa que a operação afetará. Se não informado, verifica apenas se o token já tem um empresaId vinculado.
 */
export async function garantirAcessoEmpresa(req: Request, empresaIdAlvo?: string): Promise<{ sessao: SessaoUsuario } | Response> {
    const sessao = await obterSessao(req);

    if (!sessao) {
        return jsonErro("Não autorizado. Token inválido ou ausente.", "UNAUTHORIZED", 401);
    }

    const tenantAtreladoAoToken = sessao.empresaId;

    if (!tenantAtreladoAoToken) {
        // Opcionalmente, pode buscar do Firestore (adminDb.collection('usuarios').doc(sessao.uid)) 
        // caso a custom claim ainda não tenha sido populada no login.
        return jsonErro("Usuário sem vínculo com empresa ativo.", "FORBIDDEN", 403);
    }

    if (empresaIdAlvo && tenantAtreladoAoToken !== empresaIdAlvo) {
        return jsonErro("Acesso negado à empresa solicitada.", "FORBIDDEN", 403);
    }

    return { sessao };
}
