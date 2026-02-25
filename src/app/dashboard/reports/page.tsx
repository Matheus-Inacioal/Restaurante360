import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Métricas e Produtividade</CardTitle>
                    <CardDescription>
                        Acompanhe o desempenho, execução de tarefas e aderência de rotinas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground p-8 text-center border rounded-md bg-muted/20">
                        Gráficos e relatórios gerenciais serão exibidos aqui.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
