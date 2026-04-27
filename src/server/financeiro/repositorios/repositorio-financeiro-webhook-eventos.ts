import "server-only";
import { prisma } from '@/lib/prisma';

export interface WebhookEvento {
    id: string; // usually asaas event id
    evento: string;
    processadoEm: string;
    dados: any;
}

export const repositorioFinanceiroWebhookEventos = {
    async verificarIdempotencia(eventoId: string): Promise<boolean> {
        const doc = await prisma.webhookEvento.findUnique({
            where: { id: eventoId }
        });
        return !!doc;
    },

    async registrarProcessamento(eventoId: string, evento: string, dados: any): Promise<void> {
        await prisma.webhookEvento.create({
            data: {
                id: eventoId,
                tipo: evento,
                processadoEm: new Date(),
                processado: true,
                payload: dados
            }
        });
    }
}
