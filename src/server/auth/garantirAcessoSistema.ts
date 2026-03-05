import 'server-only';
import { obterSessao, SessaoUsuario } from './obterSessao';
import { jsonErro } from '@/server/http/respostas';

/**
 * Garante que o chamador é um Superadmin (SISTEMA).
 */
export async function garantirAcessoSistema(req: Request): Promise<{ sessao: SessaoUsuario } | Response> {
    const sessao = await obterSessao(req);

    if (!sessao) {
        return jsonErro("Não autorizado. Token inválido ou ausente.", "UNAUTHORIZED", 401);
    }

    if (sessao.papelPortal !== 'SISTEMA') {
        return jsonErro("Acesso restrito a administradores do sistema.", "FORBIDDEN", 403);
    }

    return { sessao };
}
