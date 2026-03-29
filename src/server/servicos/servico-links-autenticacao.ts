import "server-only";
import { adminAuth } from "@/server/firebase/admin";
import { URL_LOGIN } from "@/lib/configuracoes/email-config";

export interface ResultadoGeracaoLink {
    ok: boolean;
    link?: string;
    erro?: string;
}

/**
 * Serviço centralizado para geração de links seguros de autenticação via Firebase Admin SDK.
 */
export const servicoLinksAutenticacao = {
    /**
     * Gera um link de redefinição de senha.
     * O usuário será direcionado ao fluxo padrão do Firebase para criar nova senha.
     */
    async gerarLinkRedefinicaoSenha(email: string): Promise<ResultadoGeracaoLink> {
        try {
            const link = await adminAuth.generatePasswordResetLink(email, {
                url: URL_LOGIN,
            });

            if (process.env.NODE_ENV !== "production") {
                console.log(`[DEV][LINKS_AUTH] Link de redefinição gerado para ${email}`);
            }

            return { ok: true, link };
        } catch (error: any) {
            console.error(`[LINKS_AUTH] Erro ao gerar link de redefinição para ${email}:`, error?.code || error);

            if (error?.code === "auth/user-not-found") {
                return { ok: false, erro: "Nenhum usuário encontrado com este e-mail." };
            }

            return { ok: false, erro: error?.message || "Falha ao gerar link de redefinição." };
        }
    },

    /**
     * Gera um link de primeiro acesso (definição de senha inicial).
     * Mesmo fluxo do Firebase (reset link), mas com contexto semântico diferente.
     */
    async gerarLinkPrimeiroAcesso(email: string): Promise<ResultadoGeracaoLink> {
        try {
            const link = await adminAuth.generatePasswordResetLink(email, {
                url: URL_LOGIN,
            });

            if (process.env.NODE_ENV !== "production") {
                console.log(`[DEV][LINKS_AUTH] Link de primeiro acesso gerado para ${email}`);
            }

            return { ok: true, link };
        } catch (error: any) {
            console.error(`[LINKS_AUTH] Erro ao gerar link de primeiro acesso para ${email}:`, error?.code || error);
            return { ok: false, erro: error?.message || "Falha ao gerar link de primeiro acesso." };
        }
    },
};
