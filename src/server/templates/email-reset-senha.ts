import "server-only";

interface ResetSenhaTemplateParams {
    nomeResponsavel?: string;
    nomeEmpresa?: string;
    emailLogin: string;
    linkReset: string;
    urlLogin: string;
}

const suporteEmail = process.env.SUPORTE_EMAIL || "suporte@restaurante360.com.br";
const suporteWhatsApp = process.env.SUPORTE_WHATSAPP || "(00) 00000-0000";

export function gerarTemplateResetSenha(params: ResetSenhaTemplateParams): { subject: string; html: string; text: string } {
    const { nomeResponsavel, nomeEmpresa, emailLogin, linkReset, urlLogin } = params;
    const saudacao = nomeResponsavel ? `Olá, <strong>${nomeResponsavel}</strong>!` : "Olá!";
    const empresaTexto = nomeEmpresa ? ` para a empresa <strong>${nomeEmpresa}</strong>` : "";

    const subject = "[Restaurante360] Definição / Redefinição de senha do seu acesso";

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9f9f9;">
  <div style="background: #fff; border-radius: 8px; padding: 32px; border: 1px solid #e0e0e0;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #1a1a1a; margin: 0;">Restaurante360</h2>
    </div>
    
    <p>${saudacao}</p>
    <p>Recebemos uma solicitação para definir (ou redefinir) a senha do seu acesso ao <strong>Restaurante360</strong>${empresaTexto}.</p>
    
    <p><strong>E-mail de login:</strong> ${emailLogin}</p>
    
    <p>Para criar sua senha com segurança, clique no botão abaixo:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${linkReset}" target="_blank" rel="noopener noreferrer"
         style="background-color: #f97316; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Definir minha senha
      </a>
    </div>
    
    <p>Ou copie e cole o link no navegador:<br/>
    <a href="${linkReset}" style="color: #f97316; word-break: break-all;">${linkReset}</a></p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
    
    <p><strong>Como fazer login após definir a senha:</strong></p>
    <ol>
      <li>Acesse: <a href="${urlLogin}" target="_blank" rel="noopener noreferrer" style="color: #f97316;">${urlLogin}</a></li>
      <li>Informe seu e-mail: <strong>${emailLogin}</strong></li>
      <li>Use a senha que você criou</li>
    </ol>
    
    <p style="margin-top: 24px; color: #666; font-size: 14px;">
      Se você não reconhece esta solicitação, ignore este e-mail com segurança. Nenhuma alteração será feita.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;"/>
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      Precisa de ajuda? Fale com a gente em 
      <a href="mailto:${suporteEmail}" style="color: #999;">${suporteEmail}</a> 
      ou pelo WhatsApp ${suporteWhatsApp}.<br/>
      Este e-mail foi enviado automaticamente pelo Restaurante360.
    </p>
  </div>
</body>
</html>`;

    const text = `
${nomeResponsavel ? `Olá, ${nomeResponsavel}!` : "Olá!"}

Recebemos uma solicitação para definir (ou redefinir) a senha do seu acesso ao Restaurante360${nomeEmpresa ? ` para a empresa ${nomeEmpresa}` : ""}.

E-mail de login: ${emailLogin}

Para criar sua senha, acesse o link:
${linkReset}

Como fazer login:
1. Acesse: ${urlLogin}
2. Informe seu e-mail: ${emailLogin}
3. Use a senha criada

Se você não reconhece esta solicitação, ignore este e-mail.

Suporte: ${suporteEmail} | WhatsApp: ${suporteWhatsApp}
`.trim();

    return { subject, html, text };
}
