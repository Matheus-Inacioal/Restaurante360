import { collection, doc, getDoc, getDocs, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import { Plano } from '../types/financeiro';

export class RepositorioPlanosFirestore {
    private colecao = 'planos';

    async criar(db: Firestore, plano: Plano): Promise<void> {
        const ref = doc(db, this.colecao, plano.id);
        await setDoc(ref, plano);
    }

    async obterPorId(db: Firestore, id: string): Promise<Plano | null> {
        const ref = doc(db, this.colecao, id);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as Plano) : null;
    }

    async listarTodos(db: Firestore): Promise<Plano[]> {
        const snaps = await getDocs(collection(db, this.colecao));
        return snaps.docs.map(d => d.data() as Plano);
    }

    async atualizar(db: Firestore, id: string, dados: Partial<Plano>): Promise<void> {
        const ref = doc(db, this.colecao, id);
        await updateDoc(ref, {
            ...dados,
            atualizadoEm: new Date().toISOString()
        });
    }
}

export const repositorioPlanosFirestore = new RepositorioPlanosFirestore();
