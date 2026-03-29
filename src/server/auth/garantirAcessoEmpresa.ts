import 'server-only';
import { obterSessao, SessaoUsuario } from './obterSessao';
import { jsonErro } from '@/server/http/respostas';
import { adminDb } from '@/server/firebase/admin';

export interface ResultadoAcessoEmpresa {
    sessao: SessaoUsuario;
    empresa: { id: string; ativo: boolean; [key: string]: any };
}

/**
 * Garante que o chamador está autenticado e pertence a uma empresa ativa.
 *
 * Fluxo:
 * 1. Valida token (Authorization Bearer)
 * 2. Obtém empresaId (da claim ou do Firestore como fallback)
 * 3. Valida que a empresa existe e está ativa no Firestore
 * 4. (Opcional) valida empresaIdAlvo se informado
 *
 * @param req Request original
 * @param empresaIdAlvo (opcional) para validar que o acesso é a uma empresa específica
 */
export async function garantirAcessoEmpresa(
    req: Request,
    empresaIdAlvo?: string
): Promise<ResultadoAcessoEmpresa | Response> {
    // 1. Obter sessão do token
    const sessao = await obterSessao(req);

    if (!sessao) {
        return jsonErro("Não autorizado. Token inválido ou ausente.", "UNAUTHORIZED", 401);
    }

    // 2. Obter empresaId — da claim OU fallback no Firestore
    let empresaId = sessao.empresaId;

    if (!empresaId) {
        // Fallback: buscar no perfil do Firestore (útil quando claims ainda não foram propagadas)
        try {
            const perfilDoc = await adminDb.collection("usuarios").doc(sessao.uid).get();
            if (perfilDoc.exists) {
                const perfil = perfilDoc.data();
                empresaId = perfil?.empresaId;

                // Preencher dados da sessão a partir do Firestore
                if (empresaId) {
                    sessao.empresaId = empresaId;
                    sessao.papelPortal = sessao.papelPortal || perfil?.papelPortal;
                    sessao.papelEmpresa = sessao.papelEmpresa || perfil?.papelEmpresa;

                    if (process.env.NODE_ENV !== "production") {
                        console.log(
                            `[DEV][ACESSO] Fallback Firestore para UID ${sessao.uid}: empresaId=${empresaId}, papelPortal=${sessao.papelPortal}`
                        );
                    }
                }
            }
        } catch (err) {
            console.error("[ACESSO] Erro ao buscar perfil no Firestore como fallback:", err);
        }
    }

    if (!empresaId) {
        return jsonErro(
            "Usuário sem vínculo com empresa. Verifique se seu cadastro está completo.",
            "FORBIDDEN",
            403
        );
    }

    // 3. Validar que a empresa existe e está ativa no Firestore
    let empresaData: any;
    try {
        const empresaDoc = await adminDb.collection("empresas").doc(empresaId).get();

        if (!empresaDoc.exists) {
            if (process.env.NODE_ENV !== "production") {
                console.warn(`[DEV][ACESSO] Empresa ${empresaId} não encontrada no Firestore.`);
            }
            return jsonErro(
                "Empresa não encontrada. Contate o suporte.",
                "FORBIDDEN",
                403
            );
        }

        empresaData = { id: empresaDoc.id, ...empresaDoc.data() };

        // Verificar se a empresa está ativa (campo 'ativo' ou 'status')
        const empresaAtiva = empresaData.ativo !== false && empresaData.status !== "inativo";
        if (!empresaAtiva) {
            return jsonErro(
                "Sua empresa está temporariamente inativa. Contate o administrador.",
                "FORBIDDEN",
                403
            );
        }
    } catch (err) {
        console.error("[ACESSO] Erro ao validar empresa no Firestore:", err);
        return jsonErro(
            "Erro ao validar vínculo com empresa.",
            "INTERNAL_ERROR",
            500
        );
    }

    // 4. Validar empresaId alvo (se informado)
    if (empresaIdAlvo && empresaId !== empresaIdAlvo) {
        return jsonErro("Acesso negado à empresa solicitada.", "FORBIDDEN", 403);
    }

    return { sessao, empresa: empresaData };
}
