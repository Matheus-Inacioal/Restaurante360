import "server-only";

interface PrimeiroAcessoTemplateParams {
    nomeResponsavel?: string;
    nomeEmpresa: string;
    emailLogin: string;
    linkReset: string;
    urlLogin: string;
}

const suporteEmail = process.env.SUPORTE_EMAIL || "suporte@restaurante360.com.br";
const suporteWhatsApp = process.env.SUPORTE_WHATSAPP || "(00) 00000-0000";

export function gerarTemplatePrimeiroAcesso(params: PrimeiroAcessoTemplateParams): { subject: string; html: string; text: string } {
    const { nomeResponsavel, nomeEmpresa, emailLogin, linkReset, urlLogin } = params;
    const saudacao = nomeResponsavel ? `Olá, <strong>${nomeResponsavel}</strong>!` : "Olá!";

    const subject = "[Restaurante360] Seu acesso foi criado — Defina sua senha";

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9f9f9;">
  <div style="background: #fff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #1a1a1a; margin: 0;">Restaurante360</h2>
      <p style="color: #666; margin: 4px 0 0 0;">Bem-vindo(a) ao sistema!</p>
    </div>

    <p>${saudacao}</p>
    <p>O cadastro da empresa <strong>${nomeEmpresa}</strong> no <strong>Restaurante360</strong> foi concluído com sucesso. 🎉</p>

    <p><strong>E-mail de login:</strong> ${emailLogin}</p>

    <p>Para definir sua senha de primeiro acesso e começar a usar o sistema, clique no botão:</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${linkReset}" target="_blank" rel="noopener noreferrer"
         style="background-color: #f97316; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Definir minha senha
      </a>
    </div>

    <p>Ou copie e cole o link no navegador:<br/>
    <a href="${linkReset}" style="color: #f97316; word-break: break-all;">${linkReset}</a></p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>

    <p><strong>Após definir a senha, acesse o painel:</strong><br/>
    <a href="${urlLogin}" target="_blank" rel="noopener noreferrer" style="color: #f97316;">${urlLogin}</a></p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>

    <p style="color: #999; font-size: 12px; text-align: center;">
      Suporte: <a href="mailto:${suporteEmail}" style="color: #999;">${suporteEmail}</a> | WhatsApp: ${suporteWhatsApp}<br/>
      Este e-mail foi enviado automaticamente pelo Restaurante360.
    </p>
  </div>
</body>
</html>`;

    const text = `
${nomeResponsavel ? `Olá, ${nomeResponsavel}!` : "Olá!"}

O cadastro da empresa ${nomeEmpresa} no Restaurante360 foi concluído com sucesso!

E-mail de login: ${emailLogin}

Para definir sua senha de primeiro acesso, acesse:
${linkReset}

Após definir a senha, entre no painel: ${urlLogin}

Suporte: ${suporteEmail} | WhatsApp: ${suporteWhatsApp}
`.trim();

    return { subject, html, text };
}
