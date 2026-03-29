import "server-only";
import { NOME_SISTEMA, URL_LOGIN, CORES_MARCA } from "@/lib/configuracoes/email-config";
import { envolverComLayout, gerarBotaoCta } from "./layout-base-email";

export interface ConviteAcessoTemplateParams {
    nomeUsuario: string;
    nomeEmpresa: string;
    emailLogin: string;
    linkAtivacao: string;
    /** Perfil ou cargo do usuário no sistema (ex.: "Gerente", "Cozinheiro") */
    perfilUsuario?: string;
}

/**
 * Gera o template de e-mail de convite de acesso ao sistema.
 * Enviado quando um gestor convida um colaborador para acessar o Restaurante360.
 */
export function gerarTemplateConviteAcesso(params: ConviteAcessoTemplateParams): { subject: string; html: string; text: string } {
    const { nomeUsuario, nomeEmpresa, emailLogin, linkAtivacao, perfilUsuario } = params;
    const perfilTexto = perfilUsuario ? ` como <strong>${perfilUsuario}</strong>` : "";

    const subject = `[${NOME_SISTEMA}] Você foi convidado(a) para o ${nomeEmpresa}`;

    const conteudo = `
<p>Olá, <strong>${nomeUsuario}</strong>! 👋</p>

<p>Você foi convidado(a) para acessar o <strong>${NOME_SISTEMA}</strong>
no restaurante <strong>${nomeEmpresa}</strong>${perfilTexto}.</p>

<p><strong>Seu e-mail de acesso:</strong> ${emailLogin}</p>

<p>Para ativar sua conta e definir sua senha, clique no botão abaixo:</p>

${gerarBotaoCta("Ativar minha conta", linkAtivacao)}

<hr style="border: none; border-top: 1px solid ${CORES_MARCA.separador}; margin: 24px 0;" />

<p><strong>O que fazer depois:</strong></p>
<ol style="padding-left: 20px;">
  <li>Defina sua senha no link acima</li>
  <li>Acesse o sistema em: <a href="${URL_LOGIN}" style="color: ${CORES_MARCA.primaria};">${URL_LOGIN}</a></li>
  <li>Informe seu e-mail: <strong>${emailLogin}</strong></li>
  <li>Use a senha que você criou</li>
</ol>

<p style="color: ${CORES_MARCA.textoSecundario}; font-size: 13px;">
  Se você não esperava este convite, entre em contato com o gestor do restaurante <strong>${nomeEmpresa}</strong>.
</p>`;

    const html = envolverComLayout(conteudo, { subtitulo: "Convite de acesso" });

    const text = `
Olá, ${nomeUsuario}! 👋

Você foi convidado(a) para acessar o ${NOME_SISTEMA} no restaurante ${nomeEmpresa}${perfilUsuario ? ` como ${perfilUsuario}` : ""}.

Seu e-mail de acesso: ${emailLogin}

Para ativar sua conta e definir sua senha, acesse:
${linkAtivacao}

O que fazer depois:
1. Defina sua senha no link acima
2. Acesse o sistema em: ${URL_LOGIN}
3. Informe seu e-mail: ${emailLogin}
4. Use a senha que você criou

Se você não esperava este convite, entre em contato com o gestor do restaurante ${nomeEmpresa}.
`.trim();

    return { subject, html, text };
}
