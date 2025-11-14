'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import type { User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function UsersPage() {
    const { firestore, user: currentUser } = useFirebase();

    const usersColRef = useMemoFirebase(() => 
        firestore ? collection(firestore, 'users') : null,
        [firestore]
    );

    const { data: users, isLoading } = useCollection<User>(usersColRef);

    const getUserInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('');
    }

    const pageTitle = "Gestão de Usuários";

  return (
    <div className="flex flex-col">
      {/* Header is in the layout, but we can update its title if needed. This page doesn't receive the user prop directly anymore */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{pageTitle}</h2>
            <p className="text-muted-foreground">
              Gerencie os acessos e funções da sua equipe.
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">Carregando usuários...</TableCell>
                    </TableRow>
                )}
                {users && users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.avatarUrl} alt={user.name} />
                                <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-0.5">
                                <p className="font-medium">{user.name}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'manager' ? 'default' : 'secondary'}
                       className={user.role === 'manager' ? '' : ''}
                      >
                        {user.role === 'manager' ? 'Gestor' : 'Colaborador'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Redefinir Senha</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Desativar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
