'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, CheckSquare, Users, KanbanSquare } from 'lucide-react';
import { useBuscaGlobal, CategoriaBusca } from '@/hooks/use-busca-global';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

export function BuscaGlobal() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { agrupados } = useBuscaGlobal();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const onSelect = useCallback(
        (url: string) => {
            setOpen(false);
            router.push(url);
        },
        [router]
    );

    const getIcon = (categoria: CategoriaBusca) => {
        switch (categoria) {
            case 'Tarefas':
                return <CheckSquare className="mr-2 h-4 w-4" />;
            case 'Rotinas':
                return <KanbanSquare className="mr-2 h-4 w-4" />;
            case 'Processos':
                return <FileText className="mr-2 h-4 w-4" />;
            case 'Usuários':
                return <Users className="mr-2 h-4 w-4" />;
            default:
                return <Search className="mr-2 h-4 w-4" />;
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="relative hidden md:flex items-center text-sm text-muted-foreground w-full sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background border rounded-md px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
            >
                <Search className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">Buscar...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            {/* Versão Mobile sem kbd */}
            <button
                onClick={() => setOpen(true)}
                className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-accent"
            >
                <Search className="h-5 w-5 text-muted-foreground" />
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Digite para buscar tarefas, processos, rotinas e usuários..." />
                <CommandList>
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                    {(Object.keys(agrupados) as CategoriaBusca[]).map((categoria) => {
                        const itens = agrupados[categoria];
                        if (itens.length === 0) return null;

                        return (
                            <CommandGroup key={categoria} heading={categoria}>
                                {itens.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        value={`${item.titulo} ${item.descricao || ''}`}
                                        onSelect={() => onSelect(item.url)}
                                    >
                                        {getIcon(categoria)}
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm text-foreground">
                                                {item.titulo}
                                            </span>
                                            {item.descricao && (
                                                <span className="text-xs text-muted-foreground line-clamp-1">
                                                    {item.descricao}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        );
                    })}
                </CommandList>
            </CommandDialog>
        </>
    );
}
