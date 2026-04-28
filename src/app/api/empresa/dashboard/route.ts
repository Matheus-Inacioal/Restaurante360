import { NextRequest, NextResponse } from 'next/server';
import { garantirAcessoEmpresa } from '@/server/auth/garantirAcessoEmpresa';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const acesso = await garantirAcessoEmpresa(req);
    if (acesso instanceof Response) return acesso;

    const empresaId = acesso.empresaId;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
        // 1. Obter todas as tarefas da empresa para extrair os KPIs
        // Em um sistema massivo, isso seria feito com aggregates. Para MVP, podemos puxar tudo 
        // ou puxar apenas contagens específicas. Vamos otimizar usando count/select.
        
        const tarefasHoje = await prisma.tarefa.findMany({
            where: { 
                empresaId,
                OR: [
                    { origemDataRef: todayStr },
                    { prazo: { gte: new Date(`${todayStr}T00:00:00.000Z`) } } // Simplificação
                ]
            },
            include: { responsavel: true }
        });

        // Caso a base esteja muito crua e o filtro de hoje não retorne nada, puxamos todas pendentes/recentes
        const todasAsTarefas = await prisma.tarefa.findMany({
            where: { empresaId },
            include: { responsavel: true },
            orderBy: { atualizadoEm: 'desc' }
        });

        const activeTeam = await prisma.usuario.count({
            where: { empresaId, status: 'ativo' }
        });

        // Cálculos
        const executionTodayTotal = todasAsTarefas.filter(t => t.origemDataRef === todayStr || (t.prazo && t.prazo.toISOString().startsWith(todayStr))).length;
        const executionTodayCompleted = todasAsTarefas.filter(t => (t.origemDataRef === todayStr || (t.prazo && t.prazo.toISOString().startsWith(todayStr))) && t.status === 'concluida').length;
        const pendingCritical = todasAsTarefas.filter(t => t.prioridade === 'Alta' && t.status !== 'concluida').length;

        // Prioridades (Pendentes, Em progresso, Atrasadas, limit 5)
        const prioritiesList = todasAsTarefas
            .filter(t => t.status === 'pendente' || t.status === 'em_progresso' || t.status === 'atrasada')
            .sort((a, b) => {
                if (!a.prazo) return 1;
                if (!b.prazo) return -1;
                return a.prazo.getTime() - b.prazo.getTime();
            })
            .slice(0, 5)
            .map(t => ({
                id: t.id,
                type: t.tipo === 'tarefa' ? 'tarefa' : 'checklist',
                title: t.titulo,
                assignee: t.responsavel?.nome || 'Não atribuído',
                deadline: t.prazo ? t.prazo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem prazo',
                status: t.prazo && t.prazo < new Date() ? 'atrasado' : 'hoje'
            }));

        // Feed de atividades (Concluídas recentemente)
        const feedList = todasAsTarefas
            .filter(t => t.status === 'concluida')
            .slice(0, 5)
            .map(t => {
                const nome = t.responsavel?.nome || 'Sistema';
                const initials = nome.substring(0, 2).toUpperCase();
                
                let tempo = 'Hoje';
                if (t.atualizadoEm) {
                    const diffEmMinutos = Math.floor((new Date().getTime() - t.atualizadoEm.getTime()) / 60000);
                    if (diffEmMinutos < 60) {
                        tempo = `há ${diffEmMinutos} min`;
                    } else if (diffEmMinutos < 1440) {
                        tempo = `há ${Math.floor(diffEmMinutos / 60)}h`;
                    } else {
                        tempo = t.atualizadoEm.toLocaleDateString('pt-BR');
                    }
                }

                return {
                    id: t.id,
                    user: nome,
                    initials,
                    action: 'concluiu algo',
                    target: t.titulo,
                    time: tempo
                };
            });

        // Dados do gráfico
        const chartData = [
            { name: 'Concluído', value: todasAsTarefas.filter(t => t.status === 'concluida').length, color: 'hsl(var(--primary))' },
            { name: 'Em Progresso', value: todasAsTarefas.filter(t => t.status === 'em_progresso').length, color: 'hsl(var(--accent))' },
            { name: 'Pendente', value: todasAsTarefas.filter(t => t.status === 'pendente' || t.status === 'atrasada').length, color: 'hsl(var(--muted-foreground))' },
        ];

        return NextResponse.json({
            ok: true,
            data: {
                executionTodayTotal: executionTodayTotal || todasAsTarefas.length, // Fallback p/ MVP ver dados
                executionTodayCompleted,
                pendingCritical,
                activeTeam,
                prioritiesList,
                feedList,
                chartData
            }
        });

    } catch (error: any) {
        console.error('[GET /api/empresa/dashboard] Erro:', error);
        return NextResponse.json(
            { ok: false, code: 'INTERNAL_ERROR', message: 'Erro ao consolidar dashboard.' },
            { status: 500 }
        );
    }
}
