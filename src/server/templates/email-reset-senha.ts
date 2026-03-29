import "server-only";
import { NOME_SISTEMA, URL_LOGIN, CORES_MARCA } from "@/lib/configuracoes/email-config";
import { envolverComLayout, gerarBotaoCta } from "./layout-base-email";

interface ResetSenhaTemplateParams {
    nomeUsuario?: string;
    nomeEmpresa?: string;
    emailLogin: string;
    linkReset: string;
}

/**
 * Gera o template de e-mail para redefinição de senha.
 * Usado tanto na rota pública ("Esqueci minha senha") quanto pelo gestor.
 */
export function gerarTemplateResetSenha(params: ResetSenhaTemplateParams): { subject: string; html: string; text: string } {
    const { nomeUsuario, nomeEmpresa, emailLogin, linkReset } = params;
    const saudacao = nomeUsuario ? `Olá, <strong>${nomeUsuario}</strong>!` : "Olá!";
    const empresaTexto = nomeEmpresa ? ` para a empresa <strong>${nomeEmpresa}</strong>` : "";

    const subject = `[${NOME_SISTEMA}] Redefinição de senha`;

    const conteudo = `
<p>${saudacao}</p>
<p>Recebemos uma solicitação para redefinir a senha do seu acesso ao <strong>${NOME_SISTEMA}</strong>${empresaTexto}.</p>

<p><strong>E-mail de login:</strong> ${emailLogin}</p>

<p>Para criar uma nova senha, clique no botão abaixo:</p>

${gerarBotaoCta("Redefinir minha senha", linkReset)}

<hr style="border: none; border-top: 1px solid ${CORES_MARCA.separador}; margin: 24px 0;" />

<p><strong>Após redefinir a senha:</strong></p>
<ol style="padding-left: 20px;">
  <li>Acesse: <a href="${URL_LOGIN}" style="color: ${CORES_MARCA.primaria};">${URL_LOGIN}</a></li>
  <li>Informe seu e-mail: <strong>${emailLogin}</strong></li>
  <li>Use a nova senha criada</li>
</ol>

<p style="margin-top: 24px; color: ${CORES_MARCA.textoSecundario}; font-size: 13px;">
  Se você não solicitou esta redefinição, ignore este e-mail. Nenhuma alteração será feita.
</p>`;

    const html = envolverComLayout(conteudo);

    const text = `
${nomeUsuario ? `Olá, ${nomeUsuario}!` : "Olá!"}

Recebemos uma solicitação para redefinir a senha do seu acesso ao ${NOME_SISTEMA}${nomeEmpresa ? ` para a empresa ${nomeEmpresa}` : ""}.

E-mail de login: ${emailLogin}

Para redefinir sua senha, acesse o link:
${linkReset}

Após redefinir:
1. Acesse: ${URL_LOGIN}
2. Informe seu e-mail: ${emailLogin}
3. Use a nova senha criada

Se você não solicitou, ignore este e-mail.
`.trim();

    return { subject, html, text };
}
