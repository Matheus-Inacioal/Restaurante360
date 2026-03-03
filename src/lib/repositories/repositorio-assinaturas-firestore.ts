import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Firestore } from 'firebase/firestore';
import { AssinaturaAsaas } from '../types/financeiro';

export class RepositorioAssinaturasFirestore {
    private colecao = 'assinaturas';

    async criar(db: Firestore, assinatura: AssinaturaAsaas): Promise<void> {
        const ref = doc(db, this.colecao, assinatura.id);
        await setDoc(ref, assinatura);
    }

    async obterPorId(db: Firestore, assinaturaId: string): Promise<AssinaturaAsaas | null> {
        const ref = doc(db, this.colecao, assinaturaId);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as AssinaturaAsaas) : null;
    }

    async atualizar(db: Firestore, assinaturaId: string, dados: Partial<AssinaturaAsaas>): Promise<void> {
        const ref = doc(db, this.colecao, assinaturaId);
        await updateDoc(ref, {
            ...dados,
            atualizadaEm: new Date().toISOString()
        });
    }

    async obterPorAsaasSubscriptionId(db: Firestore, asaasSubId: string): Promise<AssinaturaAsaas | null> {
        const q = query(collection(db, this.colecao), where('asaasSubscriptionId', '==', asaasSubId));
        const snaps = await getDocs(q);
        if (snaps.empty) return null;
        return snaps.docs[0].data() as AssinaturaAsaas;
    }
}

export const repositorioAssinaturasFirestore = new RepositorioAssinaturasFirestore();
