import "server-only";
import { NOME_SISTEMA, URL_LOGIN, CORES_MARCA } from "@/lib/configuracoes/email-config";
import { envolverComLayout, gerarBotaoCta } from "./layout-base-email";

interface PrimeiroAcessoTemplateParams {
    nomeResponsavel?: string;
    nomeEmpresa: string;
    emailLogin: string;
    linkReset: string;
}

/**
 * Gera o template de e-mail de convite / primeiro acesso.
 * Enviado quando o gestor (ou sistema) cria uma conta para o colaborador.
 */
export function gerarTemplatePrimeiroAcesso(params: PrimeiroAcessoTemplateParams): { subject: string; html: string; text: string } {
    const { nomeResponsavel, nomeEmpresa, emailLogin, linkReset } = params;
    const saudacao = nomeResponsavel ? `Olá, <strong>${nomeResponsavel}</strong>!` : "Olá!";

    const subject = `[${NOME_SISTEMA}] Seu acesso foi criado — Defina sua senha`;

    const conteudo = `
<p>${saudacao}</p>
<p>O cadastro da empresa <strong>${nomeEmpresa}</strong> no <strong>${NOME_SISTEMA}</strong> foi concluído com sucesso. 🎉</p>

<p><strong>E-mail de login:</strong> ${emailLogin}</p>

<p>Para definir sua senha de primeiro acesso e começar a usar o sistema, clique no botão abaixo:</p>

${gerarBotaoCta("Definir minha senha", linkReset)}

<hr style="border: none; border-top: 1px solid ${CORES_MARCA.separador}; margin: 24px 0;" />

<p><strong>Após definir a senha, acesse o painel:</strong><br/>
<a href="${URL_LOGIN}" style="color: ${CORES_MARCA.primaria};">${URL_LOGIN}</a></p>`;

    const html = envolverComLayout(conteudo, { subtitulo: "Bem-vindo(a) ao sistema!" });

    const text = `
${nomeResponsavel ? `Olá, ${nomeResponsavel}!` : "Olá!"}

O cadastro da empresa ${nomeEmpresa} no ${NOME_SISTEMA} foi concluído com sucesso!

E-mail de login: ${emailLogin}

Para definir sua senha de primeiro acesso, acesse:
${linkReset}

Após definir a senha, entre no painel: ${URL_LOGIN}
`.trim();

    return { subject, html, text };
}
