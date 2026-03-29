import "server-only";
import { NOME_SISTEMA, URL_LOGIN, CORES_MARCA } from "@/lib/configuracoes/email-config";
import { envolverComLayout, gerarBotaoCta } from "./layout-base-email";

interface CriacaoContaTemplateParams {
    nomeUsuario: string;
    nomeEmpresa: string;
    emailLogin: string;
    linkPrimeiroAcesso: string;
    papelUsuario?: string;
}

/**
 * Gera o template de e-mail de confirmação de criação de conta.
 * Enviado quando o gestor cria uma conta de colaborador.
 */
export function gerarTemplateCriacaoConta(params: CriacaoContaTemplateParams): { subject: string; html: string; text: string } {
    const { nomeUsuario, nomeEmpresa, emailLogin, linkPrimeiroAcesso, papelUsuario } = params;
    const papelTexto = papelUsuario ? ` como <strong>${papelUsuario}</strong>` : "";

    const subject = `[${NOME_SISTEMA}] Sua conta foi criada — Defina sua senha`;

    const conteudo = `
<p>Olá, <strong>${nomeUsuario}</strong>!</p>

<p>Uma conta foi criada para você no <strong>${NOME_SISTEMA}</strong>
no restaurante <strong>${nomeEmpresa}</strong>${papelTexto}.</p>

<p><strong>Seu e-mail de login:</strong> ${emailLogin}</p>

<p>Para começar a usar o sistema, você precisa definir sua senha de acesso. Clique no botão abaixo:</p>

${gerarBotaoCta("Definir minha senha", linkPrimeiroAcesso)}

<hr style="border: none; border-top: 1px solid ${CORES_MARCA.separador}; margin: 24px 0;" />

<p><strong>Após definir a senha:</strong></p>
<ol style="padding-left: 20px;">
  <li>Acesse: <a href="${URL_LOGIN}" style="color: ${CORES_MARCA.primaria};">${URL_LOGIN}</a></li>
  <li>Informe seu e-mail: <strong>${emailLogin}</strong></li>
  <li>Use a senha que você criou</li>
</ol>

<p style="color: ${CORES_MARCA.textoSecundario}; font-size: 13px;">
  Se você não reconhece esta mensagem, entre em contato com o gestor do seu restaurante.
</p>`;

    const html = envolverComLayout(conteudo, { subtitulo: "Sua conta está pronta!" });

    const text = `
Olá, ${nomeUsuario}!

Uma conta foi criada para você no ${NOME_SISTEMA} no restaurante ${nomeEmpresa}${papelUsuario ? ` como ${papelUsuario}` : ""}.

Seu e-mail de login: ${emailLogin}

Para definir sua senha de acesso, acesse:
${linkPrimeiroAcesso}

Após definir a senha:
1. Acesse: ${URL_LOGIN}
2. Informe seu e-mail: ${emailLogin}
3. Use a senha que você criou

Se você não reconhece esta mensagem, entre em contato com o gestor do seu restaurante.
`.trim();

    return { subject, html, text };
}
