import "server-only";
import { adminDb } from "@/server/firebase/admin";
import { LogAuditoria } from "@/lib/types/auditoria";

export const repositorioAuditoriaAdmin = {
    async registrarLog(log: Omit<LogAuditoria, "id" | "criadoEm">): Promise<void> {
        const docRef = adminDb.collection("auditoria").doc();
        await docRef.set({
            ...log,
            id: docRef.id,
            criadoEm: new Date().toISOString(),
        });
    },

    async listarRecentes(limit: number = 20): Promise<LogAuditoria[]> {
        const snap = await adminDb
            .collection("auditoria")
            .orderBy("criadoEm", "desc")
            .limit(limit)
            .get();

        return snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as LogAuditoria[];
    },
};
