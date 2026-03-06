import { fetchJSON } from '../http/fetch-json';
import { Notificacao } from '../types/notificacoes';

export const notificacoesRepository = {
    async obterTodas(empresaId: string): Promise<Notificacao[]> {
        const res = await fetchJSON<Notificacao[]>(`/api/empresa/notificacoes?empresaId=${empresaId}`);
        if (!res.ok) throw new Error(res.message);
        return res.data;
    },

    async adicionar(empresaId: string, nova: Omit<Notificacao, 'id' | 'criadoEm' | 'empresaId'>): Promise<Notificacao> {
        const payload = { ...nova, empresaId, lida: false };
        const res = await fetchJSON<Notificacao>(`/api/empresa/notificacoes`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.message);
        return res.data;
    },

    async marcarComoLida(id: string, empresaId: string): Promise<void> {
        await fetchJSON(`/api/empresa/notificacoes/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ empresaId, lida: true })
        });
    },

    async marcarTodasComoLidas(empresaId: string): Promise<void> {
        const todas = await this.obterTodas(empresaId);
        const naoLidas = todas.filter(n => !n.lida);
        await Promise.all(naoLidas.map(n =>
            fetchJSON(`/api/empresa/notificacoes/${n.id}`, {
                method: 'PUT',
                body: JSON.stringify({ empresaId, lida: true })
            })
        ));
    },

    async excluir(id: string, empresaId: string): Promise<void> {
        await fetchJSON(`/api/empresa/notificacoes/${id}?empresaId=${empresaId}`, {
            method: 'DELETE'
        });
    }
};
