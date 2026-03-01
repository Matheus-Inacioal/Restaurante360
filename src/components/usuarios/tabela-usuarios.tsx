"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { MoreHorizontal, Pencil, Ban, CheckCircle2, Search, SlidersHorizontal, KeyRound } from "lucide-react";
import type { UsuarioSistema } from "@/lib/types/usuarios";

interface TabelaUsuariosProps {
    usuarios: UsuarioSistema[];
    onEditar: (usuario: UsuarioSistema) => void;
    onInativar: (id: string, nome: string) => Promise<void>;
    onReativar: (id: string, nome: string) => Promise<void>;
    usuarioLogadoId: string; // Para impedir auto-inativação
}

export function TabelaUsuarios({
    usuarios,
    onEditar,
    onInativar,
    onReativar,
    usuarioLogadoId
}: TabelaUsuariosProps) {
    const [busca, setBusca] = useState("");
    const [filtroPapel, setFiltroPapel] = useState<string>("todos");
    const [filtroStatus, setFiltroStatus] = useState<string>("todos");

    // Estado para o Dialog de Inativação (Confirmação)
    const [usuarioParaInativar, setUsuarioParaInativar] = useState<UsuarioSistema | null>(null);

    const usuariosFiltrados = usuarios.filter((usuario) => {
        // 1. Filtro por Busca (Nome ou Email)
        const termo = busca.toLowerCase();
        const matchBusca =
            !termo ||
            usuario.nome.toLowerCase().includes(termo) ||
            usuario.email.toLowerCase().includes(termo);

        // 2. Filtro por Papel
        const matchPapel = filtroPapel === "todos" || usuario.papel === filtroPapel;

        // 3. Filtro por Status
        const matchStatus = filtroStatus === "todos" || usuario.status === filtroStatus;

        return matchBusca && matchPapel && matchStatus;
    });

    const traduzirPapel = (papel: string) => {
        switch (papel) {
            case "admin": return "Administrador";
            case "gestor": return "Gestor";
            case "operacional": return "Operacional";
            default: return papel;
        }
    };

    const getCorPapel = (papel: string) => {
        if (papel === "admin") return "default";
        if (papel === "gestor") return "secondary";
        return "outline";
    };

    return (
        <div className="space-y-4">
            {/* BARRA DE FILTROS */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou e-mail..."
                        className="pl-8"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <Select value={filtroPapel} onValueChange={setFiltroPapel}>
                        <SelectTrigger className="w-[160px]">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>{filtroPapel === "todos" ? "Todos os Papéis" : traduzirPapel(filtroPapel)}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os Papéis</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="operacional">Operacional</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os Status</SelectItem>
                            <SelectItem value="ativo">Ativos</SelectItem>
                            <SelectItem value="inativo">Inativos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* TABELA DE DADOS */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome e E-mail</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="hidden md:table-cell">Último Acesso</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usuariosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum usuário encontrado com os filtros atuais.
                                </TableCell>
                            </TableRow>
                        ) : (
                            usuariosFiltrados.map((usuario) => (
                                <TableRow key={usuario.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{usuario.nome}</span>
                                            <span className="text-sm text-muted-foreground">{usuario.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getCorPapel(usuario.papel)}>
                                            {traduzirPapel(usuario.papel)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {usuario.status === "ativo" ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                Ativo
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200">
                                                Inativo
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                        {usuario.ultimoAcessoEm
                                            ? format(new Date(usuario.ultimoAcessoEm), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                            : "Nunca acessou"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEditar(usuario)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Redefinir senha
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />

                                                {usuario.status === "ativo" ? (
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600"
                                                        disabled={usuario.id === usuarioLogadoId}
                                                        onClick={() => setUsuarioParaInativar(usuario)}
                                                    >
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        {usuario.id === usuarioLogadoId ? "Você (Não pode inativar)" : "Inativar Usuário"}
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        className="text-green-600 focus:text-green-600"
                                                        onClick={() => onReativar(usuario.id, usuario.nome)}
                                                    >
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Reativar Usuário
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* CONFIRMAÇÃO DE INATIVAÇÃO */}
            <AlertDialog
                open={!!usuarioParaInativar}
                onOpenChange={(open) => !open && setUsuarioParaInativar(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Inativar usuário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você está prestes a inativar o acesso de <strong>{usuarioParaInativar?.nome}</strong>.
                            <br /><br />
                            Ele não poderá mais acessar o sistema até que um administrador reative sua conta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                                if (usuarioParaInativar) {
                                    await onInativar(usuarioParaInativar.id, usuarioParaInativar.nome);
                                    setUsuarioParaInativar(null);
                                }
                            }}
                        >
                            Sim, inativar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
