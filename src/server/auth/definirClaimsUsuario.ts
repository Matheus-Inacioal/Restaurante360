import "server-only";
import { adminAuth } from "@/server/firebase/admin";
import type { PapelUsuario } from "@/lib/tipos/identidade";

/**
 * Define as custom claims de um usuário no Firebase Auth.
 * Essas claims são incluídas automaticamente no ID token após refresh.
 *
 * IMPORTANTE: Após chamar essa função, o cliente precisa chamar
 * `getIdToken(true)` para obter um token com as claims atualizadas.
 * O fetchJSON do projeto já faz isso automaticamente.
 *
 * Claims definidas:
 * - papel:      PapelUsuario (saasAdmin | gestorCorporativo | gestorLocal | operacional)
 * - empresaId:  string (obrigatório para todos exceto saasAdmin)
 * - unidadeId:  string (obrigatório para gestorLocal e operacional)
 */
export async function definirClaimsUsuario(
  uid: string,
  claims: {
    papel: PapelUsuario;
    empresaId?: string;
    unidadeId?: string;
  }
): Promise<void> {
  try {
    const usuario = await adminAuth.getUser(uid);
    const claimsAtuais = usuario.customClaims || {};

    const novasClaims = {
      ...claimsAtuais,
      ...claims,
    };

    await adminAuth.setCustomUserClaims(uid, novasClaims);

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV][CLAIMS] Claims atualizadas para UID ${uid}:`, novasClaims);
    }
  } catch (error) {
    console.error(`[CLAIMS] Erro ao definir claims para UID ${uid}:`, error);
    throw error;
  }
}
