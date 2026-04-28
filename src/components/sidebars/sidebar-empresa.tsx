'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    RefreshCw,
    BookOpen,
    Users,
    BarChart3,
    Settings,
    UtensilsCrossed,
    ChefHat,
    FileText,
    ListChecks,
    AlertTriangle
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from '@/components/ui/sidebar';

const navGroups = [
    {
        title: "Geral",
        items: [
            { href: '/empresa', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/empresa/tarefas', label: 'Tarefas', icon: CheckSquare },
            { href: '/empresa/rotinas', label: 'Rotinas', icon: RefreshCw },
        ]
    },
    {
        title: "OPERAÇÃO",
        items: [
            { href: '/empresa/receitas-preparos', label: 'Receitas e Preparos', icon: ChefHat },
            { href: '/empresa/pops', label: 'POPs', icon: BookOpen },
            { href: '/empresa/checklists', label: 'Checklists', icon: ListChecks },
            { href: '/empresa/ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
        ]
    },
    {
        title: "GESTÃO",
        items: [
            { href: '/empresa/usuarios', label: 'Usuários', icon: Users },
            { href: '/empresa/relatorios', label: 'Relatórios', icon: BarChart3 },
            { href: '/empresa/configuracoes', label: 'Configurações', icon: Settings },
        ]
    }
];

export function SidebarEmpresa() {
    const pathname = usePathname();

    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarHeader className="p-4">
                <Link href="/empresa" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground hover:text-sidebar-primary transition-colors">
                    <div className="p-2 bg-sidebar-primary rounded-lg">
                        <UtensilsCrossed className="h-6 w-6 text-sidebar-primary-foreground" />
                    </div>
                    <span className="font-headline group-data-[collapsible=icon]:hidden">
                        Restaurante360
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="p-2 gap-4">
                {navGroups.map((group) => (
                    <SidebarGroup key={group.title} className="p-0">
                        {group.title !== "Geral" && (
                            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {group.title}
                            </SidebarGroupLabel>
                        )}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const isActive = item.href === '/empresa'
                                        ? pathname === '/empresa'
                                        : pathname.startsWith(item.href);

                                    return (
                                        <SidebarMenuItem key={item.label}>
                                            <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                                                <Link href={item.href}>
                                                    <item.icon className="h-5 w-5" />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    );
}
