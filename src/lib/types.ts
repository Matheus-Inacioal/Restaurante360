export type UserRole = 'manager' | 'collaborator' | 'gestor' | 'bar' | 'pia' | 'cozinha' | 'producao' | 'garcon';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActivityTemplate = {
  id: string;
  title: string;
  description: string;
  category: 'Higiene' | 'Cozinha' | 'Atendimento' | 'Segurança' | 'Outro';
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  isRecurring: boolean;
  requiresPhoto: boolean;
  status: 'active' | 'inactive';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type Process = {
  id: string;
  name: string;
  description: string;
  activityIds: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskStatus = 'pending' | 'done' | 'not_applicable';

export type TaskInstance = {
  id:string;
  checklistId: string;
  activityTemplateId: string;
  title: string;
  description: string;
  requiresPhoto: boolean;
  status: TaskStatus;
  completedAt?: string;
  completedBy?: string;
  photoUrl?: string;
  feedback?: string;
};

export type ChecklistStatus = 'open' | 'in_progress' | 'completed';

export type ChecklistInstance = {
  id: string;
  date: string;
  shift: 'Manhã' | 'Tarde' | 'Noite';
  assignedTo: string; // Should be a User ID
  processName?: string;
  processId?: string;
  status: ChecklistStatus;
  tasks?: TaskInstance[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CheckIn = {
    id: string;
    userId: string;
    date: string;
    shift: string;
    createdAt: string;
}
