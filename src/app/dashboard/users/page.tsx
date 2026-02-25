import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UsersPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Gestão de Colaboradores</CardTitle>
                    <CardDescription>
                        Gerencie acessos, perfis e permissões dos usuários do sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground p-8 text-center border rounded-md bg-muted/20">
                        CRUD de usuários e perfis será listado aqui.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
