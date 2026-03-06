import "server-only";
import { adminDb } from "@/server/firebase/admin";
import { EmpresaAtualizada } from "@/lib/types/financeiro";

export const repositorioEmpresasAdmin = {
    async obterTotal(): Promise<number> {
        const snap = await adminDb.collection("empresas").count().get();
        return snap.data().count;
    },

    async listar(limit: number = 10): Promise<EmpresaAtualizada[]> {
        const snap = await adminDb
            .collection("empresas")
            .orderBy("criadoEm", "desc")
            .limit(limit)
            .get();

        return snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as EmpresaAtualizada[];
    },

    async obterPorId(id: string): Promise<EmpresaAtualizada | null> {
        const doc = await adminDb.collection("empresas").doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as EmpresaAtualizada;
    },

    async atualizar(id: string, dados: Partial<EmpresaAtualizada>): Promise<void> {
        const atualizacao = { ...dados, atualizadoEm: new Date().toISOString() };
        await adminDb.collection("empresas").doc(id).update(atualizacao);
    },

    async excluir(id: string): Promise<void> {
        // Implementar soft-delete como solicitado (arquivada = true ou status cancelado)
        await adminDb.collection("empresas").doc(id).update({
            arquivada: true,
            status: "CANCELADO",
            atualizadoEm: new Date().toISOString(),
        });
    },

    async listarPendencias(): Promise<number> {
        // Empresas com status que indique pendência: SUSPENSO (e talvez INADIMPLENTE se existir no StatusEmpresa, ou GRACE)
        const snap = await adminDb
            .collection("empresas")
            .where("status", "in", ["SUSPENSO", "GRACE"])
            .count()
            .get();
        return snap.data().count;
    },
};
