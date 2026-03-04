import "server-only";
import { adminDb } from '@/server/firebase/admin';
import { COLECOES } from '@/lib/firebase/colecoes';
import { EmpresaAtualizada } from '@/lib/types/financeiro';

export const repositorioEmpresasAdmin = {
    async criarEmpresa(dados: Omit<EmpresaAtualizada, 'id'> & { id?: string }): Promise<string> {
        const colRef = adminDb.collection(COLECOES.EMPRESAS);
        let finalId = dados.id || crypto.randomUUID();

        await colRef.doc(finalId).set({
            ...dados,
            id: finalId,
            atualizadoEm: new Date().toISOString()
        });
        return finalId;
    },

    async obterEmpresaPorId(empresaId: string): Promise<EmpresaAtualizada | null> {
        const doc = await adminDb.collection(COLECOES.EMPRESAS).doc(empresaId).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as EmpresaAtualizada;
    },

    async atualizarEmpresa(empresaId: string, dados: Partial<EmpresaAtualizada>): Promise<void> {
        await adminDb.collection(COLECOES.EMPRESAS).doc(empresaId).update({
            ...dados,
            atualizadoEm: new Date().toISOString()
        });
    }
}
