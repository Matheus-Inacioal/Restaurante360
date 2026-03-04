import "server-only";
import { adminDb } from '@/server/firebase/admin';
import { COLECOES } from '@/lib/firebase/colecoes';
import { LogAuditoria } from '@/lib/types/auditoria';

export const repositorioFinanceiroAuditoria = {
    async registrarEvento(evento: Omit<LogAuditoria, 'id' | 'criadoEm'>): Promise<void> {
        const ref = adminDb.collection(COLECOES.FINANCEIRO_AUDITORIA).doc();
        await ref.set({
            id: ref.id,
            ...evento,
            criadoEm: new Date().toISOString()
        });
    }
}
