import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Target, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DashboardCardsProps {
    pendingCritical: number;
    executionTodayCompleted: number;
    executionTodayTotal: number;
    activeTeam: number;
}

export function DashboardCards({ pendingCritical, executionTodayCompleted, executionTodayTotal, activeTeam }: DashboardCardsProps) {
    const executionPercentage = executionTodayTotal === 0 ? 0 : Math.round((executionTodayCompleted / executionTodayTotal) * 100);

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendências críticas</CardTitle>
                    <AlertCircle className={`h-4 w-4 ${pendingCritical > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${pendingCritical > 0 ? 'text-destructive' : ''}`}>
                        {pendingCritical}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {pendingCritical > 0 ? 'Requer atenção imediata' : 'Nenhuma pendência crítica 🎉'}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Execução de hoje</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {executionTodayCompleted}/{executionTodayTotal}
                    </div>
                    <Progress value={executionPercentage} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                        {executionTodayTotal === 0 ? 'Ainda não há execuções para hoje' : `${executionPercentage}% do progresso do dia`}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Equipe ativa</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeTeam}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {activeTeam === 1 ? 'Colaborador ativo hoje' : 'Colaboradores ativos hoje'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
