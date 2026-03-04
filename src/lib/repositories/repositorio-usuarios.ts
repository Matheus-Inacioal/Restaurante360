import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/client";
import { PerfilUsuario } from "../types/identidade";

export const repositorioUsuarios = {
    async obterPerfilPorUid(uid: string): Promise<PerfilUsuario | null> {
        try {
            const docRef = doc(db, "usuarios", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as PerfilUsuario;
            }
            return null;
        } catch (error) {
            console.error("Erro ao obter perfil de usuário:", error);
            throw error;
        }
    },

    async atualizarPerfil(uid: string, patch: Partial<PerfilUsuario>): Promise<void> {
        try {
            const docRef = doc(db, "usuarios", uid);
            await updateDoc(docRef, {
                ...patch,
                atualizadoEm: new Date().toISOString()
            });
        } catch (error) {
            console.error("Erro ao atualizar perfil de usuário:", error);
            throw error;
        }
    }
};
