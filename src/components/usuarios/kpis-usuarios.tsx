"use client";

import { useMemo } from "react";
import { Users, UserX, ShieldCheck, UserCog, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UsuarioSistema } from "@/lib/types/usuarios";

interface KpisUsuariosProps {
    usuarios: UsuarioSistema[];
}

export function KpisUsuarios({ usuarios }: KpisUsuariosProps) {
    const metricas = useMemo(() => {
        return {
            totalAtivos: usuarios.filter((u) => u.status === "ativo").length,
            totalInativos: usuarios.filter((u) => u.status === "inativo").length,
            totalAdmins: usuarios.filter((u) => u.papel === "admin").length,
            totalGestores: usuarios.filter((u) => u.papel === "gestor").length,
            totalOperacionais: usuarios.filter((u) => u.papel === "operacional").length,
        };
    }, [usuarios]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                    <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metricas.totalAtivos}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inativos</CardTitle>
                    <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metricas.totalInativos}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metricas.totalAdmins}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gestores</CardTitle>
                    <UserCog className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metricas.totalGestores}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Operacional</CardTitle>
                    <User className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metricas.totalOperacionais}</div>
                </CardContent>
            </Card>
        </div>
    );
}
