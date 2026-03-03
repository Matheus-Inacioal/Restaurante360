import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Firestore } from 'firebase/firestore';
import { EmpresaAtualizada } from '../types/financeiro';

export class RepositorioEmpresasFirestore {
    private colecao = 'empresas';

    async criar(db: Firestore, empresa: EmpresaAtualizada): Promise<void> {
        const ref = doc(db, this.colecao, empresa.id);
        await setDoc(ref, empresa);
    }

    async obterPorId(db: Firestore, id: string): Promise<EmpresaAtualizada | null> {
        const ref = doc(db, this.colecao, id);
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as EmpresaAtualizada) : null;
    }

    async obterPorAsaasCustomerId(db: Firestore, asaasCustomerId: string): Promise<EmpresaAtualizada | null> {
        const q = query(collection(db, this.colecao), where('asaasCustomerId', '==', asaasCustomerId));
        const snaps = await getDocs(q);
        if (snaps.empty) return null;
        return snaps.docs[0].data() as EmpresaAtualizada;
    }

    async listarTodas(db: Firestore): Promise<EmpresaAtualizada[]> {
        const snaps = await getDocs(collection(db, this.colecao));
        return snaps.docs.map(d => d.data() as EmpresaAtualizada);
    }

    async atualizar(db: Firestore, id: string, dados: Partial<EmpresaAtualizada>): Promise<void> {
        const ref = doc(db, this.colecao, id);
        await updateDoc(ref, {
            ...dados,
            atualizadoEm: new Date().toISOString()
        });
    }
}

export const repositorioEmpresasFirestore = new RepositorioEmpresasFirestore();
