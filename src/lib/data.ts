import type { User, ActivityTemplate, Process, ChecklistInstance, TaskInstance } from './types';

export const mockUsers: User[] = [
  { id: 'user-1', name: 'Ana Silva', email: 'ana.silva@example.com', role: 'manager' },
  { id: 'user-2', name: 'Carlos Souza', email: 'carlos.souza@example.com', role: 'collaborator' },
  { id: 'user-3', name: 'Beatriz Costa', email: 'beatriz.costa@example.com', role: 'collaborator' },
];

export const mockActivityTemplates: ActivityTemplate[] = [
  { id: 'act-1', title: 'Limpar chapa', description: 'Limpeza completa da chapa ao final do turno.', category: 'Cozinha', frequency: 'daily', isRecurring: true, requiresPhoto: true, status: 'active' },
  { id: 'act-2', title: 'Verificar temperatura da câmara fria', description: 'Aferir e registrar a temperatura da câmara fria.', category: 'Segurança', frequency: 'daily', isRecurring: true, requiresPhoto: false, status: 'active' },
  { id: 'act-3', title: 'Organizar estoque seco', description: 'Organizar prateleiras e verificar validades.', category: 'Cozinha', frequency: 'weekly', isRecurring: true, requiresPhoto: false, status: 'active' },
  { id: 'act-4', title: 'Limpeza profunda dos banheiros', description: 'Limpeza completa de pisos, pias e sanitários.', category: 'Higiene', frequency: 'weekly', isRecurring: true, requiresPhoto: true, status: 'active' },
  { id: 'act-5', title: 'Receber e conferir mercadorias', description: 'Conferir nota fiscal com os produtos entregues pelos fornecedores.', category: 'Cozinha', frequency: 'daily', isRecurring: false, requiresPhoto: false, status: 'active' },
  { id: 'act-6', title: 'Polir talheres e taças', description: 'Garantir que todos os talheres e taças estejam sem marcas.', category: 'Atendimento', frequency: 'daily', isRecurring: true, requiresPhoto: false, status: 'active' },
];

export const mockProcesses: Process[] = [
    { id: 'proc-1', name: 'Abertura do Restaurante', description: 'Checklist para iniciar as operações do dia.', activityIds: ['act-2', 'act-6'], isActive: true },
    { id: 'proc-2', name: 'Fechamento da Cozinha', description: 'Procedimentos para encerrar a cozinha.', activityIds: ['act-1', 'act-3'], isActive: true },
    { id: 'proc-3', name: 'Faxina Semanal', description: 'Limpeza pesada realizada toda segunda-feira.', activityIds: ['act-3', 'act-4'], isActive: true },
];

const generateTasksForChecklist = (checklistId: string, activityIds: string[]): TaskInstance[] => {
    return activityIds.map(actId => {
        const template = mockActivityTemplates.find(a => a.id === actId);
        if (!template) throw new Error('Activity template not found');
        return {
            id: `task-${checklistId}-${actId}`,
            checklistId,
            activityTemplateId: actId,
            title: template.title,
            description: template.description,
            requiresPhoto: template.requiresPhoto,
            status: 'pending',
        };
    });
};

const today = new Date().toISOString().split('T')[0];

export const mockChecklists: ChecklistInstance[] = [
    {
        id: 'chk-1',
        date: today,
        shift: 'Manhã',
        assignedTo: 'Carlos Souza',
        processName: 'Abertura do Restaurante',
        status: 'in_progress',
        tasks: [
            { id: 'task-chk-1-act-2', checklistId: 'chk-1', activityTemplateId: 'act-2', title: 'Verificar temperatura da câmara fria', description: 'Aferir e registrar a temperatura da câmara fria.', requiresPhoto: false, status: 'done', completedAt: new Date().toISOString() },
            { id: 'task-chk-1-act-6', checklistId: 'chk-1', activityTemplateId: 'act-6', title: 'Polir talheres e taças', description: 'Garantir que todos os talheres e taças estejam sem marcas.', requiresPhoto: false, status: 'pending' },
        ],
    },
    {
        id: 'chk-2',
        date: today,
        shift: 'Noite',
        assignedTo: 'Beatriz Costa',
        processName: 'Fechamento da Cozinha',
        status: 'open',
        tasks: generateTasksForChecklist('chk-2', ['act-1', 'act-3']),
    },
    {
        id: 'chk-3',
        date: today,
        shift: 'Tarde',
        assignedTo: 'Carlos Souza',
        processName: 'Tarefas Diárias Avulsas',
        status: 'completed',
        tasks: [
            { id: 'task-chk-3-act-5', checklistId: 'chk-3', activityTemplateId: 'act-5', title: 'Receber e conferir mercadorias', description: 'Conferir nota fiscal com os produtos entregues pelos fornecedores.', requiresPhoto: false, status: 'done', completedAt: new Date().toISOString() },
        ],
    },
];
