'use client';

import { LogOut } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSession } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error-handler';

export default function DashboardHeader() {
  const { isPending, data: session } = useSession();
  const userRole = session?.user?.role || null;

  if (!isPending && userRole !== 'admin') {
    redirect('/');
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4 justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="font-semibold">NakaFin</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="ghost" size="icon">
            <Sun className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar>
                <AvatarImage src={session?.user?.image || ''} />
                <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
              <DropdownMenuItem
                onClick={async () => {
                  await signOut({
                    fetchOptions: {
                      onError: (ctx) => {
                        toast.error(getErrorMessage(ctx.error));
                      },
                      onSuccess: () => {
                        redirect('/login');
                      },
                    },
                  });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
