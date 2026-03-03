import { collection, doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import { AceiteAssinatura } from '../types/financeiro';

export class RepositorioAceitesFirestore {
    private colecao = 'aceites_assinatura';

    async criar(db: Firestore, aceite: AceiteAssinatura): Promise<void> {
        const ref = doc(db, this.colecao, aceite.id);
        await setDoc(ref, aceite);
    }

    async obterPorId(db: Firestore, token: string): Promise<AceiteAssinatura | null> {
        const ref = doc(db, this.colecao, token);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return snap.data() as AceiteAssinatura;
        }
        return null;
    }

    async atualizar(db: Firestore, token: string, dados: Partial<AceiteAssinatura>): Promise<void> {
        const ref = doc(db, this.colecao, token);
        await updateDoc(ref, dados);
    }
}

export const repositorioAceitesFirestore = new RepositorioAceitesFirestore();
