import "server-only";
import { adminDb } from '@/lib/firebase/firebase-admin';
import { COLECOES } from '@/lib/firebase/colecoes';

export interface WebhookEvento {
    id: string; // usually asaas event id
    evento: string;
    processadoEm: string;
    dados: any;
}

export const repositorioFinanceiroWebhookEventos = {
    async verificarIdempotencia(eventoId: string): Promise<boolean> {
        const doc = await adminDb.collection(COLECOES.FINANCEIRO_WEBHOOK_EVENTOS).doc(eventoId).get();
        return doc.exists;
    },

    async registrarProcessamento(eventoId: string, evento: string, dados: any): Promise<void> {
        await adminDb.collection(COLECOES.FINANCEIRO_WEBHOOK_EVENTOS).doc(eventoId).set({
            id: eventoId,
            evento,
            processadoEm: new Date().toISOString(),
            dados
        });
    }
}
