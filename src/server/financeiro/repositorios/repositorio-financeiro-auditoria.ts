import "server-only";
import { prisma } from '@/lib/prisma';
import { LogAuditoria } from '@/lib/types/auditoria';

export const repositorioFinanceiroAuditoria = {
    async registrarEvento(evento: Omit<LogAuditoria, 'id' | 'criadoEm'>): Promise<void> {
        await prisma.auditoria.create({
            data: {
                empresaId: evento.empresaId,
                usuarioId: evento.usuarioId,
                acao: evento.tipo,
                entidade: "financeiro",
                entidadeId: evento.usuarioAlvoUid || evento.usuarioId,
                detalhe: evento.metadata || {}
            }
        });
    }
}
