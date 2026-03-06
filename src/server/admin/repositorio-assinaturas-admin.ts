import "server-only";
import { adminDb } from "@/server/firebase/admin";
import { AssinaturaAsaas } from "@/lib/types/financeiro";

export const repositorioAssinaturasAdmin = {
    async obterTotalAtivas(): Promise<number> {
        const snap = await adminDb
            .collection("financeiro_assinaturas")
            .where("status", "==", "ACTIVE")
            .count()
            .get();
        return snap.data().count;
    },

    async obterPorEmpresa(empresaId: string): Promise<AssinaturaAsaas | null> {
        const snap = await adminDb
            .collection("financeiro_assinaturas")
            .where("empresaId", "==", empresaId)
            .limit(1)
            .get();

        if (snap.empty) return null;
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as AssinaturaAsaas;
    },
};
