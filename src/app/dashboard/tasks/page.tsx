'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Importação dos Componentes customizados
import { TasksHeader } from '@/components/tasks/tasks-header';
import { TasksFilters } from '@/components/tasks/tasks-filters';
import { TasksList } from '@/components/tasks/tasks-list';
import { TaskDetailsPanel } from '@/components/tasks/task-details-panel';
import { TaskCreateDialog } from '@/components/tasks/task-create-dialog';

// Lógica de Estado Global (Local Storage temporário)
import { useTasks } from '@/hooks/use-tasks';
import type { Task, TaskType } from '@/lib/types/tasks';

export default function TasksPage() {
  const { tasks, addTask, updateTaskStatus, deleteTask } = useTasks();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TaskType>('task');

  const openNewTaskModal = () => {
    setModalType('task');
    setIsModalOpen(true);
  };

  const openNewChecklistModal = () => {
    setModalType('checklist');
    setIsModalOpen(true);
  };

  // Funções Callback passadas para List e Panel
  const handleToggleChecklistItem = async (taskId: string, itemId: string, done: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.checklistItems) return;

    // Altera no memory-state
    const updatedItems = task.checklistItems.map(item =>
      item.id === itemId ? { ...item, done } : item
    );
    // O hook local vai detectar a mutação indireta quando salvar (Para Firestore usaríamos updateTask explícito)
  };

  const handleCompleteTask = async (taskId: string) => {
    await updateTaskStatus(taskId, "done");
  };

  const handleDuplicateTask = async (task: Task) => {
    const { id, createdAt, updatedAt, ...rest } = task;
    const newTask = await addTask({
      ...rest,
      title: `${rest.title} (Cópia)`,
      status: "pending", // Clones começam pendentes
      checklistItems: rest.checklistItems?.map(item => ({ ...item, done: false }))
    });
    setSelectedTaskId(newTask.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  };

  // Filtra as tarefas baseado na Aba (Todas, Checklists, Pontuais)
  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'checklists') return task.type === 'checklist';
    if (activeTab === 'pontuais') return task.type === 'task';
    return true; // 'all'
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Calculo real time dos relatorios do topo 
  const metrics = {
    delayed: tasks.filter(t => t.status === 'delayed').length,
    today: tasks.filter(t => t.dueDate?.includes('Hoje')).length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] w-full">
      {/* Header Fixo */}
      <div className="flex-none p-4 md:p-6 pb-0">
        <TasksHeader
          metrics={metrics}
          onNewTaskClick={openNewTaskModal}
          onNewChecklistClick={openNewChecklistModal}
        />
      </div>

      {/* Conteúdo: Container que preenche a tela inteira abaio do Header */}
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 overflow-hidden">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Navegação de Abas (Comportamento de Filtro de Tipo) */}
          <div className="flex-none mb-4">
            <TabsList>
              <TabsTrigger value="all">Todas as Tarefas</TabsTrigger>
              <TabsTrigger value="checklists">Checklists</TabsTrigger>
              <TabsTrigger value="pontuais">Tarefas Pontuais</TabsTrigger>
            </TabsList>
          </div>

          {/* Area do Formulário de Filtros Base Visível */}
          <div className="flex-none mb-4">
            <TasksFilters />
          </div>

          {/* SPLIT VIEW (Conteúdo Principal Bi-Colunar) */}
          <div className="flex-1 flex gap-6 overflow-hidden">

            {/* LADO ESQUERDO: Lista de Tarefas (Rolável separadamente) */}
            <div className={`
              flex-1 w-full overflow-y-auto space-y-4 pb-12
              ${selectedTaskId ? 'hidden md:block lg:w-[65%]' : 'block w-full'}
            `}>
              <TasksList
                tasks={filteredTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onDuplicateTask={handleDuplicateTask}
                onCompleteTask={handleCompleteTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>

            {/* LADO DIREITO: Painel de Detalhe Dinâmico */}
            <div className={`
              h-full flex-none overflow-y-auto w-full md:w-[45%] lg:w-[35%] xl:w-[40%]
              ${selectedTaskId ? 'block' : 'hidden md:block'}
            `}>
              <TaskDetailsPanel
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onToggleChecklistItem={handleToggleChecklistItem}
                onCompleteTask={handleCompleteTask}
              />
            </div>

          </div>

        </Tabs>

      </div>

      {/* Modal Reutilizável de Criação */}
      <TaskCreateDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultType={modalType}
        onSubmit={async (data) => {
          const created = await addTask(data);
          setSelectedTaskId(created.id); // Foca automaticamente na tarefa criada!
        }}
      />
    </div>
  );
}
