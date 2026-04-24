/**
 * JWT — Restaurante360
 * Criação e verificação de tokens JWT usando jose (server-only)
 *
 * O token é usado como sessão do usuário, armazenado em cookie httpOnly.
 * Payload contém: uid, email, papel, empresaId, unidadeId
 */
import "server-only";
import { SignJWT, jwtVerify, JWTPayload } from "jose";

// ─── Configuração ─────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn(
    "[JWT] ⚠️ JWT_SECRET não definido. Defina no .env.local para ambiente de desenvolvimento."
  );
}

const secret = new TextEncoder().encode(JWT_SECRET || "dev-secret-restaurante360-TROQUE-EM-PRODUCAO");
const EXPIRACAO = "24h";
const ISSUER = "restaurante360";

// ─── Tipos ────────────────────────────────────────────────────

export interface PayloadSessao extends JWTPayload {
  uid: string;
  email: string;
  papel?: string;
  empresaId?: string;
  unidadeId?: string;
}

// ─── Funções ──────────────────────────────────────────────────

/**
 * Cria um JWT assinado com os dados da sessão do usuário.
 */
export async function criarToken(payload: Omit<PayloadSessao, "iss" | "iat" | "exp">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(EXPIRACAO)
    .sign(secret);
}

/**
 * Verifica e decodifica um JWT.
 * Retorna o payload ou null se inválido/expirado.
 */
export async function verificarToken(token: string): Promise<PayloadSessao | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
    });
    return payload as PayloadSessao;
  } catch {
    return null;
  }
}

/** Nome do cookie de sessão */
export const COOKIE_SESSAO = "r360_sessao";
