import "server-only";
import { adminDb } from '@/lib/firebase/firebase-admin';
import { COLECOES } from '@/lib/firebase/colecoes';
import { Plano } from '@/lib/types/financeiro';

export const repositorioFinanceiroPlanos = {
    async listarPlanos(): Promise<Plano[]> {
        const snapshot = await adminDb.collection(COLECOES.FINANCEIRO_PLANOS).where('ativo', '==', true).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plano));
    },

    async obterPlanoPorId(planoId: string): Promise<Plano | null> {
        const doc = await adminDb.collection(COLECOES.FINANCEIRO_PLANOS).doc(planoId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as Plano;
    }
}
