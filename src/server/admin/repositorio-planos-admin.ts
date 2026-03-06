import "server-only";
import { adminDb } from "@/server/firebase/admin";
import { Plano } from "@/lib/types/financeiro";

export const repositorioPlanosAdmin = {
    async listar(): Promise<Plano[]> {
        const snap = await adminDb
            .collection("planos")
            .where("ativo", "==", true)
            .get();

        return snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Plano[];
    },

    async obterPorId(id: string): Promise<Plano | null> {
        const doc = await adminDb.collection("planos").doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as Plano;
    },
};
