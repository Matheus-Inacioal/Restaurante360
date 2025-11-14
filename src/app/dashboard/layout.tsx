import { UtensilsCrossed } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import { MainNav } from '@/components/main-nav';
import { mockUsers } from '@/lib/data';
import Link from 'next/link';

// In a real app, you'd get the user from an auth context.
// We'll simulate a manager and a collaborator.
const manager = mockUsers.find(u => u.role === 'manager');
if (!manager) throw new Error('Manager not found in mock data');

// To view as a collaborator, change 'manager' to 'collaborator' below
const userRole = 'manager';
const currentUser = mockUsers.find(u => u.role === userRole)!;


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground hover:text-sidebar-primary transition-colors">
                <div className="p-2 bg-sidebar-primary rounded-lg">
                    <UtensilsCrossed className="h-6 w-6 text-sidebar-primary-foreground" />
                </div>
                <span className="font-headline group-data-[collapsible=icon]:hidden">
                    restaurante360
                </span>
            </Link>
        </SidebarHeader>
        <MainNav role={currentUser.role} />
        <SidebarFooter>
          {/* Footer content if any */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
