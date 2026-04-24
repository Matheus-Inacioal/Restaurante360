import "server-only";
import { prisma } from "@/lib/prisma";
import { URL_LOGIN } from "@/lib/configuracoes/email-config";

export interface ResultadoGeracaoLink {
    ok: boolean;
    link?: string;
    erro?: string;
}

/**
 * Serviço centralizado para geração de links seguros de autenticação via PostgreSQL.
 */
export const servicoLinksAutenticacao = {
    /**
     * Gera um link de redefinição de senha para um usuário.
     * Se o usuário não existir, retorna um erro ou um fake sucesso (a cargo da API decidir).
     */
    async gerarLinkRedefinicaoSenha(email: string): Promise<ResultadoGeracaoLink> {
        try {
            const usuario = await prisma.usuario.findUnique({
                where: { email },
            });

            if (!usuario) {
                return { ok: false, erro: "Nenhum usuário encontrado com este e-mail." };
            }

            // Expirar tokens antigos não usados do usuário (opcional, boa prática)
            await prisma.tokenResetSenha.updateMany({
                where: { usuarioId: usuario.id, usado: false },
                data: { usado: true },
            });

            // Gerar token via Prisma (cuid é gerado automaticamente pelo @default(cuid()))
            // Vamos gerar um UUID mais longo por segurança se preferir, ou usar o cuid do Prisma.
            const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

            // Create token explicitly defining the token string. Using standard crypto would be best,
            // but Next.js edge/server handles `crypto.randomUUID()` well.
            const tokenString = crypto.randomUUID();

            await prisma.tokenResetSenha.create({
                data: {
                    usuarioId: usuario.id,
                    token: tokenString,
                    expiraEm,
                },
            });

            const appUrl = process.env.APP_URL || "http://localhost:9002";
            const link = `${appUrl}/login/redefinir-senha?token=${tokenString}`;

            if (process.env.NODE_ENV !== "production") {
                console.log(`[DEV][LINKS_AUTH] Link de redefinição gerado para ${email}: ${link}`);
            }

            return { ok: true, link };
        } catch (error: any) {
            console.error(`[LINKS_AUTH] Erro ao gerar link de redefinição para ${email}:`, error);
            return { ok: false, erro: error?.message || "Falha ao gerar link de redefinição." };
        }
    },

    /**
     * Gera um link de primeiro acesso (definição de senha inicial).
     * O fluxo subjacente é o mesmo do reset, mas pode ter metadados diferentes no futuro.
     */
    async gerarLinkPrimeiroAcesso(email: string): Promise<ResultadoGeracaoLink> {
        // Para a implementação atual baseada em tokens PostgreSQL,
        // o link de primeiro acesso é essencialmente um link de redefinição.
        return this.gerarLinkRedefinicaoSenha(email);
    },
};
