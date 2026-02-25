import type { Task, TaskStatus } from "../types/tasks";

export interface TasksRepository {
    getAll(): Promise<Task[]>;
    getById(id: string): Promise<Task | null>;
    create(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task>;
    update(id: string, updates: Partial<Task>): Promise<Task>;
    delete(id: string): Promise<void>;
}

const LOCAL_STORAGE_KEY = "r360_tasks";

export class LocalTasksRepository implements TasksRepository {
    private getTasksFromStorage(): Task[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    private saveTasksToStorage(tasks: Task[]): void {
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
        }
    }

    async getAll(): Promise<Task[]> {
        return this.getTasksFromStorage();
    }

    async getById(id: string): Promise<Task | null> {
        const tasks = this.getTasksFromStorage();
        return tasks.find((t) => t.id === id) || null;
    }

    async create(taskData: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
        const tasks = this.getTasksFromStorage();
        const now = new Date().toISOString();

        const newTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };

        tasks.push(newTask);
        this.saveTasksToStorage(tasks);
        return newTask;
    }

    async update(id: string, updates: Partial<Task>): Promise<Task> {
        const tasks = this.getTasksFromStorage();
        const index = tasks.findIndex((t) => t.id === id);

        if (index === -1) {
            throw new Error(`Task with ID ${id} not found.`);
        }

        const updatedTask: Task = {
            ...tasks[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        tasks[index] = updatedTask;
        this.saveTasksToStorage(tasks);
        return updatedTask;
    }

    async delete(id: string): Promise<void> {
        const tasks = this.getTasksFromStorage();
        const filteredTasks = tasks.filter((t) => t.id !== id);
        this.saveTasksToStorage(filteredTasks);
    }
}

// Factory export
export const tasksRepository = new LocalTasksRepository();
