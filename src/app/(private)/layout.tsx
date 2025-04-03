import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import DashboardSidebar from '@/app/(private)/_components/sidebar';
import DashboardHeader from '@/app/(private)/_components/header';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user?.role !== 'admin') {
    redirect('/login');
  }
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-background flex w-full">
        <DashboardSidebar />
        <div className="flex-1 min-h-screen w-full">
          <DashboardHeader />
          <main className="w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
