'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Bell,
    Check,
    CheckCircle2,
    AlertCircle,
    Clock,
    MoreHorizontal,
    Info
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import { useNotificacoes } from '@/hooks/use-notificacoes';
import { CategoriaNotificacao, Notificacao } from '@/lib/types/notificacoes';
import { cn } from '@/lib/utils';

export function Notificacoes() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const {
        notificacoes,
        naoLidas,
        marcarComoLida,
        marcarTodasComoLidas
    } = useNotificacoes();

    const handleAction = (notificacao: Notificacao) => {
        // Marca como lida
        if (!notificacao.lida) {
            marcarComoLida(notificacao.id);
        }

        // Navegação contextual
        if (notificacao.origem === 'tarefas') {
            router.push('/dashboard/tarefas');
        } else if (notificacao.origem === 'rotinas') {
            router.push('/dashboard/routines');
        } else if (notificacao.origem === 'processos') {
            router.push('/dashboard/processes');
        }
        setOpen(false);
    };

    const getIconeCategoria = (tipo: CategoriaNotificacao) => {
        switch (tipo) {
            case 'tarefa_atrasada':
                return <Clock className="h-4 w-4 text-destructive" />;
            case 'tarefa_atribuida':
                return <CheckCircle2 className="h-4 w-4 text-primary" />;
            case 'rotina_alerta':
                return <AlertCircle className="h-4 w-4 text-warning" />;
            case 'sistema':
            default:
                return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted focus-visible:ring-0">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                {naoLidas > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background"
                                    >
                                        {naoLidas > 99 ? '99+' : naoLidas}
                                    </Badge>
                                )}
                                <span className="sr-only">Notificações</span>
                            </Button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Notificações</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent align="end" className="w-[340px] md:w-[380px] p-0" onInteractOutside={() => setOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                    <DropdownMenuLabel className="font-semibold text-sm p-0">Notificações</DropdownMenuLabel>
                    {naoLidas > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={marcarTodasComoLidas}
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar lidas
                        </Button>
                    )}
                </div>

                <DropdownMenuGroup className="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar py-1">
                    {notificacoes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-foreground">Nenhuma notificação</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Você está em dia com tudo!
                            </p>
                        </div>
                    ) : (
                        notificacoes.map((notificacao) => (
                            <DropdownMenuItem
                                key={notificacao.id}
                                className={cn(
                                    "flex items-start gap-3 p-3 cursor-pointer transition-colors focus:bg-muted",
                                    !notificacao.lida ? "bg-primary/5" : "opacity-75"
                                )}
                                onClick={() => handleAction(notificacao)}
                            >
                                <div className="mt-0.5 mt-1 shrink-0 bg-background rounded-full p-1 shadow-sm border">
                                    {getIconeCategoria(notificacao.tipo)}
                                </div>

                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn(
                                            "text-sm font-medium leading-none truncate",
                                            !notificacao.lida && "font-semibold"
                                        )}>
                                            {notificacao.titulo}
                                        </p>
                                        {!notificacao.lida && (
                                            <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary mt-1" />
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {notificacao.descricao}
                                    </p>

                                    <span className="text-[10px] text-muted-foreground/80 mt-1 font-medium">
                                        {formatDistanceToNow(new Date(notificacao.criadoEm), { addSuffix: true, locale: ptBR })}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuGroup>

                {notificacoes.length > 0 && (
                    <>
                        <DropdownMenuSeparator className="m-0" />
                        <div className="p-2 bg-muted/20">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => {
                                    setOpen(false);
                                    // Rota teórica global no MVP para logs completos:
                                    // router.push('/dashboard/notificacoes')
                                }}
                            >
                                <MoreHorizontal className="h-3 w-3 mr-1" />
                                Ver histórico
                            </Button>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
