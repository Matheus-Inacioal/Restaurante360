'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useRelatorios } from '@/hooks/use-relatorios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeletorPeriodoRelatorios } from '@/components/relatorios/seletor-periodo-relatorios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { CalendarIcon, Download, CheckCircle, AlertCircle, ListTodo, Activity, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportarXLSXPacoteCompleto } from '@/lib/exportacao/exportar-xlsx-completo';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
    const {
        filtros,
        setFiltros,
        isLoading,
        kpis,
        serieDiaria,
        tarefasFiltradas,
        obterDatasetParaExportacaoAba,
        obterPacoteCompletoParaExportacao,
        dataCorteInicial,
        dataCorteFinal,
    } = useRelatorios();

    const [activeTab, setActiveTab] = useState<'Visão Geral' | 'Tarefas' | 'Rotinas' | 'Processos'>('Visão Geral');
    const { toast } = useToast();

    const handleExportCSV = () => {
        try {
            const data = obterDatasetParaExportacaoAba(activeTab);
            if (data.linhas.length === 0) {
                toast({ title: 'Aviso', description: 'Não há dados para exportar nesta aba.', variant: 'destructive' });
                return;
            }

            // Converter array de objetos para CSV string
            const headers = Object.keys(data.linhas[0]).join(',');
            const rows = data.linhas.map(row =>
                Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
            );
            const csvStr = [headers, ...rows].join('\n');

            const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `restaurante360_relatorio_${activeTab.toLowerCase().replace(' ', '_')}_${format(dataCorteInicial, 'yyyyMMdd')}_a_${format(dataCorteFinal, 'yyyyMMdd')}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({ title: 'Sucesso', description: 'Exportação CSV iniciada.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao gerar CSV.', variant: 'destructive' });
        }
    };

    const handleExportPDF = () => {
        try {
            const data = obterDatasetParaExportacaoAba(activeTab);
            if (data.linhas.length === 0) {
                toast({ title: 'Aviso', description: 'Não há dados para exportar nesta aba.', variant: 'destructive' });
                return;
            }

            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text(`Relatório - ${activeTab}`, 14, 22);

            doc.setFontSize(10);
            doc.text(`Período: ${format(dataCorteInicial, 'dd/MM/yyyy')} a ${format(dataCorteFinal, 'dd/MM/yyyy')}`, 14, 30);
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35);

            const headers = Object.keys(data.linhas[0]);
            const body = data.linhas.map(row => Object.values(row).map(String));

            // jsPDF autoTable extension
            autoTable(doc, {
                startY: 45,
                head: [headers],
                body: body,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            });

            doc.save(`restaurante360_relatorio_${activeTab.toLowerCase().replace(' ', '_')}_${format(dataCorteInicial, 'yyyyMMdd')}_a_${format(dataCorteFinal, 'yyyyMMdd')}.pdf`);
            toast({ title: 'Sucesso', description: 'Exportação PDF iniciada.' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao exportar em PDF. Tente usar CSV/XLSX ou verifique as dependências.', variant: 'destructive' });
        }
    };

    const handleExportXLSX = () => {
        try {
            toast({ title: 'Exportando', description: 'Gerando a planilha completa. Isso pode demorar alguns segundos.' });

            const pacote = obterPacoteCompletoParaExportacao();
            const filename = `restaurante360_relatorio_completo_${format(dataCorteInicial, 'yyyyMMdd')}_a_${format(dataCorteFinal, 'yyyyMMdd')}`;

            exportarXLSXPacoteCompleto({
                nomeArquivo: filename,
                metadados: pacote.metadados,
                abas: pacote.abas
            });
            // Importante: o toast de sucesso ou finalização precisaria de um callback.
            // Como a função utiliza setTimeout(0), consideramos sucesso o despache da ação.
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro', description: 'Falha ao exportar pacote completo (XLSX).', variant: 'destructive' });
        }
    };

    return (
        <div className="w-full px-4 md:px-8 py-8 h-[calc(100vh-4rem)] overflow-y-auto bg-muted/10">
            <div className="max-w-[1200px] mx-auto space-y-8 pb-10">

                {/* CABEÇALHO & FILTROS */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h1>
                        <p className="text-muted-foreground mt-1">
                            Análise de produtividade, aderência de rotinas e execução de processos.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <SeletorPeriodoRelatorios
                            periodo={filtros.periodo}
                            dataInicial={filtros.dataInicial}
                            dataFinal={filtros.dataFinal}
                            onChange={({ periodo, dataInicial, dataFinal }) => {
                                setFiltros(prev => ({
                                    ...prev,
                                    periodo,
                                    dataInicial,
                                    dataFinal,
                                }));
                            }}
                        />

                        <Select
                            value={filtros.responsavelId || "todos"}
                            onValueChange={(v) => setFiltros(prev => ({ ...prev, responsavelId: v === 'todos' ? undefined : v }))}
                        >
                            <SelectTrigger className="w-[180px] bg-background">
                                <SelectValue placeholder="Responsável" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="user1" disabled>Usuário 1 (Mock)</SelectItem>
                            </SelectContent>
                        </Select>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 text-white min-w-[140px]">
                                    <Download className="mr-2 h-4 w-4" />
                                    Exportar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                                <DropdownMenuItem onClick={handleExportCSV}>Exportar CSV (Aba Atual)</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportPDF}>Exportar PDF (Aba Atual)</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportXLSX} className="font-medium text-emerald-600 focus:text-emerald-700">
                                    Exportar Planilha Completa (XLSX)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* KPIs Section */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="bg-background shadow-sm border-muted">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Total de Tarefas</p>
                                <ListTodo className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold">{isLoading ? '-' : kpis.totalTarefas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-background shadow-sm border-muted">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">{isLoading ? '-' : kpis.concluidas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-background shadow-sm border-muted">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Atrasadas</p>
                                <AlertCircle className="h-4 w-4 text-rose-500" />
                            </div>
                            <div className="text-2xl font-bold text-rose-600">{isLoading ? '-' : kpis.atrasadas}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-background shadow-sm border-muted">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Taxa Conclusão</p>
                                <Activity className="h-4 w-4 text-indigo-500" />
                            </div>
                            <div className="text-2xl font-bold">{isLoading ? '-' : `${kpis.taxaConclusao.toFixed(1)}%`}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-background shadow-sm border-muted">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">Aderência Rotinas</p>
                                <CheckSquare className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="text-2xl font-bold">{isLoading ? '-' : `${kpis.aderenciaRotinas.toFixed(1)}%`}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráfico Principal */}
                <Card className="bg-background shadow-sm border-muted">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground/90">Histórico de Execução Diária</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground animate-pulse">
                                Carregando gráfico...
                            </div>
                        ) : serieDiaria.length === 0 ? (
                            <div className="h-[350px] w-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                                <BarChart className="h-12 w-12 text-muted mb-2 opacity-50" />
                                <p>Nenhum dado registrado neste período.</p>
                            </div>
                        ) : (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={serieDiaria} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="Data"
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="Concluídas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar dataKey="Atrasadas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        <Bar dataKey="Em Progresso" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* TABS DE DETALHAMENTO */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-6">
                        <TabsTrigger value="Visão Geral">Visão Geral</TabsTrigger>
                        <TabsTrigger value="Tarefas">Tarefas</TabsTrigger>
                        <TabsTrigger value="Rotinas">Rotinas</TabsTrigger>
                        <TabsTrigger value="Processos">Processos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="Visão Geral" className="space-y-4">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardContent className="p-0 text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-background/50">
                                Aba Visão Geral está utilizando os cards e gráficos acima.
                                Ao exportar, estes mesmos KPIs serão listados em formato tabular.
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="Tarefas">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Tarefas no Período</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <p className="text-center py-6 text-muted-foreground text-sm">Carregando...</p>
                                ) : tarefasFiltradas.length === 0 ? (
                                    <p className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded bg-muted/20">Sem tarefas no período selecionado.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Título</th>
                                                    <th className="px-4 py-3 font-medium">Status</th>
                                                    <th className="px-4 py-3 font-medium">Prioridade</th>
                                                    <th className="px-4 py-3 font-medium">Prazo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tarefasFiltradas.slice(0, 10).map((t, i) => (
                                                    <tr key={t.id || i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-foreground">{t.titulo}</td>
                                                        <td className="px-4 py-3 capitalize">
                                                            <span className={cn("px-2 py-1 rounded-full text-[11px] font-semibold tracking-wide",
                                                                t.status === 'concluida' ? 'bg-emerald-100 text-emerald-700' :
                                                                    t.status === 'em_progresso' ? 'bg-blue-100 text-blue-700' :
                                                                        'bg-zinc-100 text-zinc-700'
                                                            )}>
                                                                {t.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 capitalize text-muted-foreground">{t.prioridade || '-'}</td>
                                                        <td className="px-4 py-3 text-muted-foreground flex items-center gap-1.5">
                                                            <CalendarIcon className="h-3.5 w-3.5" />
                                                            {t.prazo ? format(new Date(t.prazo), 'dd/MM/yyyy') : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {tarefasFiltradas.length > 10 && (
                                            <div className="text-center pt-4 text-xs text-muted-foreground">
                                                Exibindo 10 de {tarefasFiltradas.length}. Exporte para ver todos.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="Rotinas">
                        <Card>
                            <CardContent className="p-12 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-background/50">
                                Integração fina com checklist instância em andamento.<br />
                                (Ver painel exportar para dump da base)
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="Processos">
                        <Card>
                            <CardContent className="p-12 text-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-background/50">
                                Integração com execuções de POP em andamento.<br />
                                (Ver painel exportar para dump da base)
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>

            </div>
        </div>
    );
}
