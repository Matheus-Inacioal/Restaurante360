import "server-only";
import { adminDb } from '@/server/firebase/admin';
import { COLECOES } from '@/lib/firebase/colecoes';
import { AceiteAssinatura } from '@/lib/types/financeiro';

export const repositorioFinanceiroAceites = {
    async criarAceite(dados: Omit<AceiteAssinatura, 'id'> & { id?: string }): Promise<string> {
        const colRef = adminDb.collection(COLECOES.FINANCEIRO_ACEITES);
        if (dados.id) {
            await colRef.doc(dados.id).set(dados);
            return dados.id;
        } else {
            const result = await colRef.add(dados);
            return result.id;
        }
    },

    async obterAceitePorToken(token: string): Promise<AceiteAssinatura | null> {
        const doc = await adminDb.collection(COLECOES.FINANCEIRO_ACEITES).doc(token).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() } as AceiteAssinatura;
    },

    async marcarAceiteComoAceito(aceiteId: string, dados: Partial<AceiteAssinatura>): Promise<void> {
        await adminDb.collection(COLECOES.FINANCEIRO_ACEITES).doc(aceiteId).update({
            ...dados,
            status: 'ACEITO',
            atualizadoEm: new Date().toISOString()
        });
    }
}
