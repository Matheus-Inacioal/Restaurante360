import { fetchJSON } from "../http/fetch-json";

/**
 * Repositório de autenticação (client-side).
 * Métodos para operações de auth pública (esqueci senha, etc.).
 */
export const repositorioAutenticacao = {
    /**
     * Solicita envio de e-mail de redefinição de senha (rota pública).
     * Não requer usuário autenticado.
     */
    async enviarEmailRedefinicaoSenha(email: string): Promise<{ ok: boolean; debugLink?: string }> {
        const res = await fetchJSON<{ debugLink?: string }>("/api/auth/enviar-reset", {
            method: "POST",
            body: JSON.stringify({ email }),
            autenticar: false, // Rota pública — não envia Bearer token
        });
        if (!res.ok) throw new Error(res.message);
        return { ok: true, debugLink: res.data?.debugLink };
    },
};
