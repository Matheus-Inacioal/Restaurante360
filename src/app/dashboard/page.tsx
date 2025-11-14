import { Header } from '@/components/header';
import { mockUsers } from '@/lib/data';
import { ManagerDashboard } from '@/components/manager/manager-dashboard';
import { CollaboratorDashboard } from '@/components/collaborator/collaborator-dashboard';

// In a real app, this would come from an auth context
const userRole = 'manager'; 
const currentUser = mockUsers.find(u => u.role === userRole)!;

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <Header user={currentUser} title="Dashboard" />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {currentUser.role === 'manager' ? <ManagerDashboard /> : <CollaboratorDashboard />}
      </main>
    </div>
  );
}
