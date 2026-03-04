import "server-only";
import { adminDb } from '@/server/firebase/admin';
import { COLECOES } from '@/lib/firebase/colecoes';
import { Assinatura } from '@/lib/types/financeiro';

export const repositorioFinanceiroAssinaturas = {
    async criarOuAtualizarAssinatura(empresaId: string, dados: Partial<Assinatura> & { id?: string }): Promise<string> {
        let docId = dados.id || empresaId;
        const ref = adminDb.collection(COLECOES.FINANCEIRO_ASSINATURAS).doc(docId);

        await ref.set({
            ...dados,
            empresaId,
            atualizadoEm: new Date().toISOString()
        }, { merge: true });

        return docId;
    },

    async obterAssinaturaPorEmpresa(empresaId: string): Promise<Assinatura | null> {
        const snapshot = await adminDb.collection(COLECOES.FINANCEIRO_ASSINATURAS)
            .where('empresaId', '==', empresaId)
            .limit(1)
            .get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Assinatura;
    }
}
