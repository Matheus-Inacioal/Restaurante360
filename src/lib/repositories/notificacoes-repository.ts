import { Notificacao } from '../types/notificacoes';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = '@Restaurante360:notificacoes';

// Dados iniciais Mock para apresentar o valor do produto
const mockNotificacoesIniciais: Notificacao[] = [
    {
        id: uuidv4(),
        titulo: 'Tarefa Atrasada',
        descricao: 'A tarefa "Limpeza da Coifa" passou do prazo.',
        tipo: 'tarefa_atrasada',
        lida: false,
        criadoEm: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min atrás
        origem: 'tarefas',
    },
    {
        id: uuidv4(),
        titulo: 'Nova Tarefa Atribuída',
        descricao: 'Você foi designado para "Conferir Estoque Diário".',
        tipo: 'tarefa_atribuida',
        lida: false,
        criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
        origem: 'tarefas',
    },
    {
        id: uuidv4(),
        titulo: 'Baixa Aderência de Rotina',
        descricao: 'A rotina de "Fechamento de Caixa" não foi preenchida ontem.',
        tipo: 'rotina_alerta',
        lida: true,
        criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 dia atrás
        origem: 'rotinas',
    },
];

export const notificacoesRepository = {
    obterTodas(): Notificacao[] {
        if (typeof window === 'undefined') return mockNotificacoesIniciais;

        const registradasLocal = localStorage.getItem(STORAGE_KEY);
        if (!registradasLocal) {
            this.salvarTodas(mockNotificacoesIniciais);
            return mockNotificacoesIniciais;
        }

        try {
            return JSON.parse(registradasLocal);
        } catch {
            return mockNotificacoesIniciais;
        }
    },

    salvarTodas(todas: Notificacao[]): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todas));
        }
    },

    adicionar(nova: Omit<Notificacao, 'id' | 'criadoEm'>): Notificacao {
        const atual = this.obterTodas();
        const registro: Notificacao = {
            ...nova,
            id: uuidv4(),
            criadoEm: new Date().toISOString(),
            lida: false
        };
        this.salvarTodas([registro, ...atual]);
        return registro;
    },

    marcarComoLida(id: string): void {
        const atual = this.obterTodas();
        const atualizado = atual.map(n => n.id === id ? { ...n, lida: true } : n);
        this.salvarTodas(atualizado);
    },

    marcarTodasComoLidas(): void {
        const atual = this.obterTodas();
        const atualizadas = atual.map(n => ({ ...n, lida: true }));
        this.salvarTodas(atualizadas);
    },

    excluir(id: string): void {
        const atual = this.obterTodas();
        this.salvarTodas(atual.filter(n => n.id !== id));
    }
};
