import "server-only";

import { enviarEmail, type ResultadoEnvioEmail } from "@/server/email/enviar-email";
import { gerarTemplateConviteAcesso, type ConviteAcessoTemplateParams } from "@/server/templates/template-convite-acesso";
import { gerarTemplateCriacaoConta } from "@/server/templates/template-criacao-conta";
import { gerarTemplateBoasVindas } from "@/server/templates/template-boas-vindas";
import { gerarTemplateResetSenha } from "@/server/templates/email-reset-senha";
import { gerarTemplatePrimeiroAcesso } from "@/server/templates/email-primeiro-acesso";

// ─── Tipos dos parâmetros de cada método ────────────────────────────────────

export interface ParamsConviteAcesso {
    nomeUsuario: string;
    nomeEmpresa: string;
    emailDestinatario: string;
    linkAtivacao: string;
    perfilUsuario?: string;
}

export interface ParamsCriacaoConta {
    nomeUsuario: string;
    nomeEmpresa: string;
    emailDestinatario: string;
    linkPrimeiroAcesso: string;
    papelUsuario?: string;
}

export interface ParamsBoasVindas {
    nomeUsuario: string;
    nomeEmpresa: string;
    emailDestinatario: string;
}

export interface ParamsResetSenha {
    emailDestinatario: string;
    linkReset: string;
    nomeUsuario?: string;
    nomeEmpresa?: string;
}

export interface ParamsPrimeiroAcesso {
    nomeResponsavel?: string;
    nomeEmpresa: string;
    emailDestinatario: string;
    linkReset: string;
}

// ─── Serviço centralizado ───────────────────────────────────────────────────

/**
 * Serviço centralizado de envio de e-mails transacionais.
 * Encapsula: validação → geração de template → envio via provedor universal.
 *
 * Todos os métodos retornam `ResultadoEnvioEmail` padronizado ({ ok: true } | { ok: false, error }).
 */
export const servicoEmail = {
    /**
     * Envia e-mail de convite de acesso ao sistema.
     * Usado quando um gestor convida um colaborador.
     */
    async enviarEmailConviteAcesso(params: ParamsConviteAcesso): Promise<ResultadoEnvioEmail> {
        const { nomeUsuario, nomeEmpresa, emailDestinatario, linkAtivacao, perfilUsuario } = params;

        if (!emailDestinatario || !nomeUsuario || !nomeEmpresa || !linkAtivacao) {
            return { ok: false, error: "Dados obrigatórios ausentes para envio de convite de acesso." };
        }

        try {
            const template = gerarTemplateConviteAcesso({
                nomeUsuario,
                nomeEmpresa,
                emailLogin: emailDestinatario,
                linkAtivacao,
                perfilUsuario,
            });

            return await enviarEmail({
                to: emailDestinatario,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });
        } catch (erro: any) {
            console.error("[SERVICO_EMAIL] Falha ao enviar convite de acesso:", erro);
            return { ok: false, error: erro?.message || "Erro ao enviar e-mail de convite de acesso." };
        }
    },

    /**
     * Envia e-mail de criação de conta.
     * Usado quando o gestor cria uma conta de colaborador.
     */
    async enviarEmailCriacaoConta(params: ParamsCriacaoConta): Promise<ResultadoEnvioEmail> {
        const { nomeUsuario, nomeEmpresa, emailDestinatario, linkPrimeiroAcesso, papelUsuario } = params;

        if (!emailDestinatario || !nomeUsuario || !nomeEmpresa || !linkPrimeiroAcesso) {
            return { ok: false, error: "Dados obrigatórios ausentes para envio de criação de conta." };
        }

        try {
            const template = gerarTemplateCriacaoConta({
                nomeUsuario,
                nomeEmpresa,
                emailLogin: emailDestinatario,
                linkPrimeiroAcesso,
                papelUsuario,
            });

            return await enviarEmail({
                to: emailDestinatario,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });
        } catch (erro: any) {
            console.error("[SERVICO_EMAIL] Falha ao enviar criação de conta:", erro);
            return { ok: false, error: erro?.message || "Erro ao enviar e-mail de criação de conta." };
        }
    },

    /**
     * Envia e-mail de boas-vindas.
     * Usado após o colaborador definir sua senha e acessar o sistema pela primeira vez.
     */
    async enviarEmailBoasVindas(params: ParamsBoasVindas): Promise<ResultadoEnvioEmail> {
        const { nomeUsuario, nomeEmpresa, emailDestinatario } = params;

        if (!emailDestinatario || !nomeUsuario || !nomeEmpresa) {
            return { ok: false, error: "Dados obrigatórios ausentes para envio de boas-vindas." };
        }

        try {
            const template = gerarTemplateBoasVindas({
                nomeUsuario,
                nomeEmpresa,
                emailLogin: emailDestinatario,
            });

            return await enviarEmail({
                to: emailDestinatario,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });
        } catch (erro: any) {
            console.error("[SERVICO_EMAIL] Falha ao enviar boas-vindas:", erro);
            return { ok: false, error: erro?.message || "Erro ao enviar e-mail de boas-vindas." };
        }
    },

    /**
     * Envia e-mail de redefinição de senha.
     * Usado no fluxo "Esqueci minha senha" ou pelo gestor.
     */
    async enviarEmailResetSenha(params: ParamsResetSenha): Promise<ResultadoEnvioEmail> {
        const { emailDestinatario, linkReset, nomeUsuario, nomeEmpresa } = params;

        if (!emailDestinatario || !linkReset) {
            return { ok: false, error: "Dados obrigatórios ausentes para envio de reset de senha." };
        }

        try {
            const template = gerarTemplateResetSenha({
                nomeUsuario,
                nomeEmpresa,
                emailLogin: emailDestinatario,
                linkReset,
            });

            return await enviarEmail({
                to: emailDestinatario,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });
        } catch (erro: any) {
            console.error("[SERVICO_EMAIL] Falha ao enviar reset de senha:", erro);
            return { ok: false, error: erro?.message || "Erro ao enviar e-mail de reset de senha." };
        }
    },

    /**
     * Envia e-mail de primeiro acesso (definição de senha inicial).
     * Usado quando o sistema cria a empresa e o responsável precisa definir sua senha.
     */
    async enviarEmailPrimeiroAcesso(params: ParamsPrimeiroAcesso): Promise<ResultadoEnvioEmail> {
        const { nomeResponsavel, nomeEmpresa, emailDestinatario, linkReset } = params;

        if (!emailDestinatario || !nomeEmpresa || !linkReset) {
            return { ok: false, error: "Dados obrigatórios ausentes para envio de primeiro acesso." };
        }

        try {
            const template = gerarTemplatePrimeiroAcesso({
                nomeResponsavel,
                nomeEmpresa,
                emailLogin: emailDestinatario,
                linkReset,
            });

            return await enviarEmail({
                to: emailDestinatario,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });
        } catch (erro: any) {
            console.error("[SERVICO_EMAIL] Falha ao enviar primeiro acesso:", erro);
            return { ok: false, error: erro?.message || "Erro ao enviar e-mail de primeiro acesso." };
        }
    },
};
