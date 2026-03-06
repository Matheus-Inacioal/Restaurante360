import "server-only";
import { adminDb } from "@/server/firebase/admin";
import { Cobranca } from "@/lib/types/financeiro";

export const repositorioCobrancasAdmin = {
    async listarPorEmpresa(empresaId: string): Promise<Cobranca[]> {
        const snap = await adminDb
            .collection("financeiro_cobrancas")
            .where("empresaId", "==", empresaId)
            .orderBy("vencimento", "desc")
            .get();

        return snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Cobranca[];
    },
};
