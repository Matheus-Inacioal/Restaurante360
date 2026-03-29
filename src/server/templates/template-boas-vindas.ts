import "server-only";
import { NOME_SISTEMA, URL_LOGIN, CORES_MARCA } from "@/lib/configuracoes/email-config";
import { envolverComLayout, gerarBotaoCta } from "./layout-base-email";

interface BoasVindasTemplateParams {
    nomeUsuario: string;
    nomeEmpresa: string;
    emailLogin: string;
}

/**
 * Gera o template de e-mail de boas-vindas.
 * Enviado após o colaborador definir sua senha e acessar o sistema pela primeira vez.
 */
export function gerarTemplateBoasVindas(params: BoasVindasTemplateParams): { subject: string; html: string; text: string } {
    const { nomeUsuario, nomeEmpresa, emailLogin } = params;

    const subject = `[${NOME_SISTEMA}] Bem-vindo(a), ${nomeUsuario}!`;

    const conteudo = `
<p>Olá, <strong>${nomeUsuario}</strong>! 👋</p>

<p>Seja muito bem-vindo(a) ao <strong>${NOME_SISTEMA}</strong>!</p>

<p>Você agora faz parte da equipe do restaurante <strong>${nomeEmpresa}</strong>. Seu acesso já está ativo e pronto para uso.</p>

<p><strong>Seus dados de acesso:</strong></p>
<ul style="padding-left: 20px;">
  <li><strong>E-mail:</strong> ${emailLogin}</li>
  <li><strong>Senha:</strong> a que você definiu no primeiro acesso</li>
</ul>

<p><strong>O que você pode fazer no ${NOME_SISTEMA}:</strong></p>
<ul style="padding-left: 20px;">
  <li>📋 Acompanhar suas tarefas do dia</li>
  <li>🔄 Executar rotinas operacionais</li>
  <li>📖 Consultar processos e POPs</li>
  <li>✅ Registrar conclusão de atividades</li>
</ul>

${gerarBotaoCta("Acessar o sistema", URL_LOGIN)}

<p style="color: ${CORES_MARCA.textoSecundario}; font-size: 13px;">
  Dica: salve o link do sistema nos favoritos do seu navegador para acesso rápido.
</p>`;

    const html = envolverComLayout(conteudo, { subtitulo: "Bem-vindo(a) à equipe!" });

    const text = `
Olá, ${nomeUsuario}! 👋

Seja bem-vindo(a) ao ${NOME_SISTEMA}!

Você agora faz parte da equipe do restaurante ${nomeEmpresa}.

Seus dados de acesso:
- E-mail: ${emailLogin}
- Senha: a que você definiu no primeiro acesso

O que você pode fazer:
- Acompanhar suas tarefas do dia
- Executar rotinas operacionais
- Consultar processos e POPs
- Registrar conclusão de atividades

Acesse o sistema: ${URL_LOGIN}
`.trim();

    return { subject, html, text };
}
