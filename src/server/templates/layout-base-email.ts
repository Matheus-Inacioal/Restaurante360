import "server-only";
import {
    NOME_SISTEMA,
    SUPORTE_EMAIL,
    SUPORTE_WHATSAPP,
    CORES_MARCA,
} from "@/lib/configuracoes/email-config";

interface OpcoeLayout {
    /** Subtítulo exibido abaixo do nome do sistema no header */
    subtitulo?: string;
}

/**
 * Envolve o conteúdo HTML de um e-mail com o layout base do sistema.
 * Inclui header com nome do sistema, container responsivo e footer com suporte.
 *
 * @param conteudo HTML interno do e-mail (o corpo específico do template)
 * @param opcoes Opções do layout (subtítulo no header, etc.)
 * @returns HTML completo pronto para envio
 */
export function envolverComLayout(conteudo: string, opcoes?: OpcoeLayout): string {
    const { subtitulo } = opcoes || {};
    const c = CORES_MARCA;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${NOME_SISTEMA}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: ${c.textoPrincipal}; background-color: ${c.fundoPagina};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${c.fundoPagina};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: ${c.fundoCard}; border-radius: 12px; border: 1px solid ${c.bordaCard}; overflow: hidden;">

          <!-- HEADER -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${c.textoPrincipal};">${NOME_SISTEMA}</h1>
              ${subtitulo ? `<p style="margin: 6px 0 0 0; font-size: 14px; color: ${c.textoSecundario};">${subtitulo}</p>` : ""}
            </td>
          </tr>

          <!-- CONTEÚDO -->
          <tr>
            <td style="padding: 8px 32px 24px 32px; font-size: 15px; line-height: 1.6; color: ${c.textoPrincipal};">
              ${conteudo}
            </td>
          </tr>

          <!-- SEPARADOR -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid ${c.separador}; margin: 0;" />
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 32px 28px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: ${c.textoTerciario}; line-height: 1.5;">
                Precisa de ajuda?
                <a href="mailto:${SUPORTE_EMAIL}" style="color: ${c.textoTerciario}; text-decoration: underline;">${SUPORTE_EMAIL}</a>
                | WhatsApp: ${SUPORTE_WHATSAPP}
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; color: ${c.textoTerciario};">
                Este e-mail foi enviado automaticamente pelo ${NOME_SISTEMA}. Não é necessário responder.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Gera um botão CTA centralizado para uso nos templates de e-mail.
 */
export function gerarBotaoCta(texto: string, url: string): string {
    const c = CORES_MARCA;
    return `
<div style="text-align: center; margin: 28px 0;">
  <a href="${url}" target="_blank" rel="noopener noreferrer"
     style="display: inline-block; background-color: ${c.primaria}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; mso-padding-alt: 14px 32px;">
    ${texto}
  </a>
</div>
<p style="text-align: center; font-size: 12px; color: ${c.textoTerciario}; margin: 0;">
  Ou copie e cole no navegador:<br/>
  <a href="${url}" style="color: ${c.primaria}; word-break: break-all; font-size: 12px;">${url}</a>
</p>`;
}
