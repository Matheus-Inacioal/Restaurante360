import { collection, doc, setDoc, query, where, getDocs, Firestore, serverTimestamp } from 'firebase/firestore';
import { LogAuditoria } from '../types/auditoria';

export class RepositorioAuditoriaFirestore {
    private colecao = 'auditoria';

    async registrar(db: Firestore, log: LogAuditoria): Promise<void> {
        const ref = doc(db, this.colecao, log.id);
        await setDoc(ref, {
            ...log,
            criadoEm: log.criadoEm || new Date().toISOString(),
            timestampFirebase: serverTimestamp()
        });
    }

    async listarPorEmpresa(db: Firestore, empresaId: string): Promise<LogAuditoria[]> {
        const q = query(collection(db, this.colecao), where('empresaId', '==', empresaId));
        const snaps = await getDocs(q);
        return snaps.docs.map(d => d.data() as LogAuditoria);
    }

    async listarTodas(db: Firestore): Promise<LogAuditoria[]> {
        const snaps = await getDocs(collection(db, this.colecao));
        return snaps.docs.map(d => d.data() as LogAuditoria);
    }
}

export const repositorioAuditoriaFirestore = new RepositorioAuditoriaFirestore();
