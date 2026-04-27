import "server-only";
import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function inicializarFirebaseAdmin() {
    if (getApps().length > 0) return getApps()[0];

    // Opção 1: JSON completo do service account via env var (mais seguro para produção/Vercel)
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            return initializeApp({ credential: cert(serviceAccount) });
        } catch (err) {
            throw new Error(
                "[FIREBASE_ADMIN] FIREBASE_SERVICE_ACCOUNT_JSON inválido — verifique se é um JSON válido."
            );
        }
    }

    // Opção 2: Variáveis individuais (FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
        });
    }

    // Opção 3: GOOGLE_APPLICATION_CREDENTIALS (caminho para arquivo de service account)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        return initializeApp({ credential: applicationDefault() });
    }

    // Nenhuma configuração encontrada
    throw new Error(
        "[FIREBASE_ADMIN_NOT_CONFIGURED] Nenhuma credencial do Firebase Admin encontrada. " +
        "Defina FIREBASE_SERVICE_ACCOUNT_JSON, ou FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, " +
        "ou GOOGLE_APPLICATION_CREDENTIALS no .env.local"
    );
}

const app = inicializarFirebaseAdmin();

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
