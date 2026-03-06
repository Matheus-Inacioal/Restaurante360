import "server-only";
import { adminDb } from "@/server/firebase/admin";
import { UsuarioSistema } from "@/lib/types/usuarios";

export const repositorioUsuariosAdmin = {
    async obterTotalSistema(): Promise<number> {
        const snap = await adminDb
            .collection("usuarios")
            .where("papelPortal", "==", "SISTEMA")
            .count()
            .get();
        return snap.data().count;
    },
};
