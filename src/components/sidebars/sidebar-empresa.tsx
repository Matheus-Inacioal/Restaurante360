'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardCheck,
    CalendarClock,
    BookOpen,
    Users,
    BarChart3,
    Settings,
    UtensilsCrossed
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
    { href: '/empresa', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/empresa/tarefas', label: 'Tarefas', icon: ClipboardCheck },
    { href: '/empresa/rotinas', label: 'Rotinas', icon: CalendarClock },
    { href: '/empresa/processos', label: 'Processos', icon: BookOpen },
    { href: '/empresa/usuarios', label: 'Usuários', icon: Users },
    { href: '/empresa/relatorios', label: 'Relatórios', icon: BarChart3 },
    { href: '/empresa/configuracoes', label: 'Configurações', icon: Settings },
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
            <SidebarContent className="p-2">
                <SidebarMenu>
                    {navItems.map((item) => {
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
            </SidebarContent>
        </Sidebar>
    );
}
