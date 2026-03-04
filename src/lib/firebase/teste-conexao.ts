import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./client";

export async function testarConexaoFirestore() {
    try {
        const colecaoRef = collection(db, "teste");
        const docRef = await addDoc(colecaoRef, {
            mensagem: "Firebase conectado ✅",
            criadoEm: serverTimestamp()
        });

        return { sucesso: true, id: docRef.id };
    } catch (error: any) {
        console.error("Falha ao testar conexão do Firestore:", error);
        throw error;
    }
}
