/**
 * Configuração central de e-mails do sistema Restaurante360.
 * Todas as constantes de e-mail devem ser importadas daqui.
 */

/** Nome do sistema exibido em e-mails e assuntos */
export const NOME_SISTEMA = "Restaurante360";

/** E-mail remetente (From) */
export const EMAIL_FROM = process.env.EMAIL_FROM || `${NOME_SISTEMA} <noreply@restaurante360.com.br>`;

/** E-mail de resposta (Reply-To) */
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || "restaurantee360@gmail.com";

/** E-mail de suporte exibido no rodapé dos e-mails */
export const SUPORTE_EMAIL = process.env.SUPORTE_EMAIL || "restaurantee360@gmail.com";

/** WhatsApp de suporte exibido no rodapé dos e-mails */
export const SUPORTE_WHATSAPP = process.env.SUPORTE_WHATSAPP || "(00) 00000-0000";

/** URL base da aplicação */
export const URL_APP = process.env.APP_URL || "http://localhost:9002";

/** URL da página de login */
export const URL_LOGIN = `${URL_APP}/login`;

/** Cores da marca para uso nos templates HTML */
export const CORES_MARCA = {
    /** Cor primária (botões, links) */
    primaria: "#f97316",
    /** Cor primária hover */
    primariaHover: "#ea580c",
    /** Texto principal */
    textoPrincipal: "#1a1a1a",
    /** Texto secundário */
    textoSecundario: "#666666",
    /** Texto terciário (rodapé) */
    textoTerciario: "#999999",
    /** Fundo do body */
    fundoPagina: "#f9f9f9",
    /** Fundo do card */
    fundoCard: "#ffffff",
    /** Borda do card */
    bordaCard: "#e0e0e0",
    /** Linha separadora */
    separador: "#eeeeee",
} as const;
