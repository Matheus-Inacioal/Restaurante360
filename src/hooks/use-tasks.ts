"use client";

import { useState, useEffect, useCallback } from "react";
import type { Task, TaskStatus } from "../lib/types/tasks";
import { tasksRepository } from "../lib/repositories/tasks-repository";
import { useToast } from "@/hooks/use-toast";

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const loadTasks = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await tasksRepository.getAll();
            setTasks(data);
        } catch (error) {
            console.error("Failed to load tasks:", error);
            toast({
                title: "Erro ao carregar tarefas",
                description: "Houve um problema ao buscar suas tarefas.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const addTask = async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
        try {
            const newTask = await tasksRepository.create(taskData);
            setTasks((prev) => [...prev, newTask]);

            toast({
                title: "Sucesso!",
                description: `"${newTask.title}" foi criada.`,
            });
            return newTask;
        } catch (error) {
            toast({
                title: "Erro",
                description: "Não foi possível criar a tarefa.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const updateTask = async (id: string, updates: Partial<Task>) => {
        try {
            const updatedTask = await tasksRepository.update(id, updates);
            setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
            return updatedTask;
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao atualizar a tarefa.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await tasksRepository.delete(id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
            toast({
                title: "Tarefa removida",
                description: "A tarefa foi removida com sucesso.",
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao excluir a tarefa.",
                variant: "destructive",
            });
            throw error;
        }
    };

    const updateTaskStatus = async (id: string, status: TaskStatus) => {
        return updateTask(id, { status });
    };

    return {
        tasks,
        isLoading,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        refreshTasks: loadTasks,
    };
}
