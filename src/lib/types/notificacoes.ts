export type CategoriaNotificacao = 'tarefa_atrasada' | 'tarefa_atribuida' | 'sistema' | 'rotina_alerta';

export interface Notificacao {
    id: string;
    titulo: string;
    descricao: string;
    tipo: CategoriaNotificacao;
    lida: boolean;
    criadoEm: string;
    origem?: string;
    entidadeId?: string;
}
