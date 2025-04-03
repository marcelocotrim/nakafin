'use client';

import { useState, Suspense } from 'react';
import { UsersTable } from './_components/users-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Home } from 'lucide-react';
import { CreateUserDialog } from './_components/create-user-dialog';
import { admin } from '@/lib/auth-client';
import { User } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const getUsers = async (): Promise<User[]> => {
  const { data } = await admin.listUsers({
    query: {
      limit: 100,
      offset: 0,
    },
  });

  return (data?.users as User[]) || [];
};

export default function UsersPage() {
  const [open, setOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <div className="p-4">
        <div className="flex flex-col gap-4 mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">
                  <Home className="h-4 w-4" />
                  <span className="sr-only">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbPage>Usuários</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
        </div>
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <UsersTable data={users || []} loading={isLoading} />
            </CardContent>
          </Card>
        </div>
        <CreateUserDialog open={open} onOpenChange={setOpen} />
      </div>
    </Suspense>
  );
}
