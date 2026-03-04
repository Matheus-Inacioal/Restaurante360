import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Regex para restaurar as quebras de linha reais da chave privada
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Variáveis do Firebase Admin ausentes no .env.local (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
}

const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
            projectId: projectId || "demo-project",
            clientEmail: clientEmail || "demo@demo.com",
            privateKey: privateKey || "-----BEGIN PRIVATE KEY-----\nDEMO\n-----END PRIVATE KEY-----\n",
        }),
    });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
