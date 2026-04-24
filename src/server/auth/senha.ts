/**
 * Utilitários de senha — Restaurante360
 * Hash e verificação de senhas usando bcrypt (server-only)
 */
import "server-only";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Gera o hash bcrypt de uma senha em texto plano.
 */
export async function hashSenha(senhaPlana: string): Promise<string> {
  return bcrypt.hash(senhaPlana, SALT_ROUNDS);
}

/**
 * Compara uma senha em texto plano com um hash bcrypt.
 * Retorna true se correspondem.
 */
export async function verificarSenha(
  senhaPlana: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(senhaPlana, hash);
}
