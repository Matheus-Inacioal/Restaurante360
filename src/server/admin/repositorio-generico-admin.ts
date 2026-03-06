import "server-only";
import { adminDb } from "@/server/firebase/admin";

export const repositorioGenericoAdmin = {
    async listar(colecao: string, empresaId: string) {
        const snap = await adminDb.collection(colecao).where('empresaId', '==', empresaId).get();
        // Ordenação client-side ou firebase. Aqui vamos mandar puro e ordenar onde necessário, ou ordenar pelo criadoEm
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a: any, b: any) => {
            if (a.criadoEm && b.criadoEm) {
                return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
            }
            return 0;
        });
    },

    async obterPorId(colecao: string, empresaId: string, id: string) {
        const doc = await adminDb.collection(colecao).doc(id).get();
        if (!doc.exists) return null;

        const data = doc.data() as any;
        if (data.empresaId !== empresaId) return null; // Trava de tenant de segurança

        return { id: doc.id, ...data };
    },

    async criar(colecao: string, empresaId: string, data: any) {
        // Se a data já contiver um id gerado pelo frontend (por exemplo crypto.randomUUID), usaremos ele, senão o firebase gera
        const customId = data.id;
        const docRef = customId ? adminDb.collection(colecao).doc(customId) : adminDb.collection(colecao).doc();

        const agora = new Date().toISOString();
        const payload = {
            ...data,
            empresaId,
            id: docRef.id,
            criadoEm: data.criadoEm || agora,
            atualizadoEm: data.atualizadoEm || agora
        };

        await docRef.set(payload);
        return payload;
    },

    async atualizar(colecao: string, empresaId: string, id: string, atualizacoes: any) {
        const docRef = adminDb.collection(colecao).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error(`Item com ID ${id} não encontrado na coleção ${colecao}.`);
        }

        if (doc.data()?.empresaId !== empresaId) {
            throw new Error("Acesso negado: Tentativa de atualizar dado de outro tenant.");
        }

        const agora = new Date().toISOString();
        const payload = { ...atualizacoes, atualizadoEm: agora };

        await docRef.update(payload);
        return { id, ...doc.data(), ...payload };
    },

    async excluir(colecao: string, empresaId: string, id: string) {
        const docRef = adminDb.collection(colecao).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) return true; // Já foi excluido

        if (doc.data()?.empresaId !== empresaId) {
            throw new Error("Acesso negado: Tentativa de excluir dado de outro tenant.");
        }

        await docRef.delete();
        return true;
    }
};
