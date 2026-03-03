import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Firestore } from 'firebase/firestore';
import { Cobranca } from '../types/financeiro';

export class RepositorioCobrancasFirestore {
    private colecao = 'cobrancas';

    async criar(db: Firestore, cobranca: Cobranca): Promise<void> {
        const ref = doc(db, this.colecao, cobranca.id);
        await setDoc(ref, cobranca);
    }

    async obterPorId(db: Firestore, cobrancaId: string): Promise<Cobranca | null> {
        const ref = doc(db, this.colecao, cobrancaId);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as Cobranca) : null;
    }

    async atualizaCobranca(db: Firestore, id: string, dados: Partial<Cobranca>): Promise<void> {
        const ref = doc(db, this.colecao, id);
        await updateDoc(ref, {
            ...dados,
            atualizadaEm: new Date().toISOString()
        });
    }

    async obterPorAsaasPaymentId(db: Firestore, asaasPaymentId: string): Promise<Cobranca | null> {
        const q = query(collection(db, this.colecao), where('asaasPaymentId', '==', asaasPaymentId));
        const snaps = await getDocs(q);
        if (snaps.empty) return null;
        return snaps.docs[0].data() as Cobranca;
    }

    async listarPorEmpresa(db: Firestore, empresaId: string): Promise<Cobranca[]> {
        const q = query(collection(db, this.colecao), where('empresaId', '==', empresaId));
        const snaps = await getDocs(q);
        return snaps.docs.map(d => d.data() as Cobranca);
    }
}

export const repositorioCobrancasFirestore = new RepositorioCobrancasFirestore();
