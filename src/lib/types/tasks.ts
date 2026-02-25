export type TaskStatus = "pending" | "in_progress" | "done" | "delayed";
export type TaskType = "task" | "checklist";

export interface ChecklistItem {
    id: string;
    text: string;
    done: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    type: TaskType;
    status: TaskStatus;
    priority: "Alta" | "Média" | "Baixa";
    assignee?: string;
    dueDate?: string; // ISO
    tags?: string[];
    checklistItems?: ChecklistItem[];
    createdAt: string; // ISO
    updatedAt: string; // ISO
}
