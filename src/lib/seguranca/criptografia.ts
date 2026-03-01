/**
 * Utilitários para criptografia e validação nativos no lado do Client-side limitados a ambiente de browser via Web Crypto API.
 */

/**
 * Gera um salt randômico seguro em formato string (Hex).
 */
export function gerarSalt(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Faz o hash de modo assíncrono combinando senha em texto pleno + o salt
 * usando a Web Crypto API (SubtleCrypto) garantindo SHA-256.
 * Retorna string no formato local hexadecimal.
 */
export async function hashSenhaSHA256(senha: string, salt: string): Promise<string> {
    const textoParaHash = `${salt}:${senha}`;
    const encoder = new TextEncoder();
    const dados = encoder.encode(textoParaHash);

    const hashBuffer = await crypto.subtle.digest("SHA-256", dados);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}
