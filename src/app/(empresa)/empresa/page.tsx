'use client';

import { ManagerDashboard } from '@/components/manager/manager-dashboard';

export default function PortalEmpresaDashboard() {
  return (
    <div className="flex flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <ManagerDashboard />
      </main>
    </div>
  );
}
