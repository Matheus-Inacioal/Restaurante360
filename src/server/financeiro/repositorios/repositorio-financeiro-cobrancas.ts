import "server-only";
import { adminDb } from '@/lib/firebase/firebase-admin';
import { COLECOES } from '@/lib/firebase/colecoes';
import { Cobranca } from '@/lib/types/financeiro';

export const repositorioFinanceiroCobrancas = {
    async criarOuAtualizarCobrancaPorAsaasPaymentId(asaasPaymentId: string, dados: Partial<Cobranca> & { id?: string }): Promise<string> {
        // Find existing to update, or create new
        const snapshot = await adminDb.collection(COLECOES.FINANCEIRO_COBRANCAS)
            .where('asaasPaymentId', '==', asaasPaymentId)
            .limit(1)
            .get();

        let docRef;
        if (!snapshot.empty) {
            docRef = snapshot.docs[0].ref;
        } else {
            docRef = adminDb.collection(COLECOES.FINANCEIRO_COBRANCAS).doc(dados.id || crypto.randomUUID());
            dados.criadoEm = dados.criadoEm || new Date().toISOString();
        }

        await docRef.set({
            ...dados,
            asaasPaymentId,
            atualizadoEm: new Date().toISOString()
        }, { merge: true });

        return docRef.id;
    },

    async listarCobrancasPorEmpresa(empresaId: string, limite: number = 10): Promise<Cobranca[]> {
        const snapshot = await adminDb.collection(COLECOES.FINANCEIRO_COBRANCAS)
            .where('empresaId', '==', empresaId)
            .orderBy('vencimento', 'desc')
            .limit(limite)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cobranca));
    }
}
