'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  LayoutDashboard,
  ClipboardCheck,
  LogIn,
  Workflow,
  PlusCircle,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/types';
import { Button } from './ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const managerNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/dashboard/manager/checklists',
    label: 'Checklists',
    icon: ClipboardList,
  },
  {
    href: '#',
    label: 'Gestão',
    icon: Settings,
    children: [
      { href: '/dashboard/manager/activities', label: 'Atividades', icon: ClipboardCheck },
      { href: '/dashboard/manager/processes', label: 'Processos', icon: Workflow },
      { href: '/dashboard/manager/users', label: 'Usuários', icon: Users },
    ],
  },
  { href: '/dashboard/manager/reports', label: 'Relatórios', icon: BarChart3 },
];

const collaboratorNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Meu Painel', icon: LayoutDashboard },
  {
    href: '/dashboard/collaborator/tasks',
    label: 'Minhas Tarefas',
    icon: ClipboardCheck,
  },
  {
    href: '/dashboard/collaborator/check-in',
    label: 'Check-in',
    icon: LogIn,
  },
];

export function MainNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const navItems = role === 'manager' || role === 'gestor' ? managerNavItems : collaboratorNavItems;

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const isActive = pathname === item.href;
      if (item.children) {
        const isChildActive = item.children.some(child => pathname.startsWith(child.href))
        return (
          <SidebarMenuItem key={item.label}>
             <SidebarMenuButton
              isActive={isChildActive}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </SidebarMenuButton>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname.startsWith(child.href)}
                  >
                    <Link href={child.href}>
                      <child.icon className="mr-2 h-4 w-4" />
                      {child.label}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </SidebarMenuItem>
        )
      }

      return (
        <SidebarMenuItem key={item.label}>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarContent className="p-2">
      <SidebarMenu>{renderNavItems(navItems)}</SidebarMenu>
    </SidebarContent>
  );
}
