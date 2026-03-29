import "server-only";
import { adminAuth } from "@/server/firebase/admin";

/**
 * Define as custom claims de um usuário no Firebase Auth.
 * Essas claims são incluídas automaticamente no ID token após refresh.
 * 
 * IMPORTANTE: Após chamar essa função, o cliente precisa chamar
 * `getIdToken(true)` para obter um token com as claims atualizadas.
 * O fetchJSON do projeto já faz isso automaticamente.
 */
export async function definirClaimsUsuario(
    uid: string,
    claims: {
        empresaId?: string;
        papelPortal?: string;   // "SISTEMA" | "EMPRESA" | "OPERACIONAL"
        papelEmpresa?: string;  // "GESTOR" | "ADMIN" | "OPERACIONAL"
    }
): Promise<void> {
    try {
        // Preservar claims existentes e mesclar com as novas
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
