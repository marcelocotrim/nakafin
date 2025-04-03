'use client';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupContent } from '@/components/ui/sidebar';
import { LayoutDashboard, Calendar, Users2, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

// Menu items.
const items = [
  {
    title: 'Eventos',
    url: '/events',
    icon: Calendar,
  },
  {
    title: 'Financeiro',
    url: '/finance',
    icon: DollarSign,
  },
];

export default function DashboardSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <SidebarMenuButton isActive={pathname === '/'}>
                  <LayoutDashboard />
                  Início
                </SidebarMenuButton>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" color="black" hidden={open}>
              Início
            </TooltipContent>
          </Tooltip>
          <Separator />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={pathname === item.url}>
                          <a href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </TooltipTrigger>
                    <TooltipContent side="right" hidden={open}>
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                ))}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/users'}>
                        <a href="/users">
                          <Users2 />
                          Usuários
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="right" hidden={open}>
                    Usuários
                  </TooltipContent>
                </Tooltip>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
