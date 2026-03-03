'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ClipboardCheck,
    CalendarClock,
    BookOpen,
    Bell,
    LifeBuoy,
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
    { href: '/operacional', label: 'Minhas Tarefas', icon: ClipboardCheck },
    { href: '/operacional/rotinas', label: 'Rotinas', icon: CalendarClock },
    { href: '/operacional/processos', label: 'Processos', icon: BookOpen },
    { href: '/operacional/notificacoes', label: 'Notificações', icon: Bell },
    { href: '/operacional/ajuda', label: 'Ajuda', icon: LifeBuoy },
    { href: '/operacional/configuracoes', label: 'Configurações', icon: Settings },
];

export function SidebarOperacional() {
    const pathname = usePathname();

    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarHeader className="p-4">
                <Link href="/operacional" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground hover:text-sidebar-primary transition-colors">
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
                        const isActive = item.href === '/operacional'
                            ? pathname === '/operacional'
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
