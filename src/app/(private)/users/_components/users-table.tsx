'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { DataTable } from './data-table';
import { admin } from '@/lib/auth-client';
import { toast } from 'sonner';
import { User } from '@prisma/client';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

const changePasswordSchema = z
  .object({
    password: z.string().min(6, {
      message: 'A senha deve ter pelo menos 6 caracteres.',
    }),
    confirmPassword: z.string().min(6, {
      message: 'A senha deve ter pelo menos 6 caracteres.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const UserActions = ({ user }: { user: User }) => {
  const queryClient = useQueryClient();
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleSetRole = async (newRole: 'admin' | 'user') => {
    try {
      await admin.setRole({
        userId: user.id,
        role: newRole,
      });
      toast.success('Função do usuário atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Erro ao atualizar função do usuário. Tente novamente.');
    }
  };

  const handleBanUser = async () => {
    try {
      await admin.banUser({
        userId: user.id,
      });
      toast.success('Usuário banido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowBanDialog(false);
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Erro ao banir usuário. Tente novamente.');
    }
  };

  const handleUnbanUser = async () => {
    try {
      await admin.unbanUser({
        userId: user.id,
      });
      toast.success('Usuário desbanido com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowUnbanDialog(false);
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Erro ao desbanir usuário. Tente novamente.');
    }
  };

  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      await admin.setUserPassword({
        userId: user.id,
        newPassword: values.password,
      });
      toast.success('Senha alterada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowPasswordDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erro ao alterar senha. Tente novamente.');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => console.log('View user:', user)}>Ver detalhes</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>{user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>Alterar senha</DropdownMenuItem>
          {!user.banned ? (
            <DropdownMenuItem onClick={() => setShowBanDialog(true)} className="text-red-600">
              Banir usuário
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setShowUnbanDialog(true)} className="text-green-600">
              Desbanir usuário
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar função do usuário</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  <strong>Usuário:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Função atual:</strong> {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
                <p>
                  <strong>Nova função:</strong> {user.role === 'admin' ? 'Usuário' : 'Administrador'}
                </p>
                <p className="mt-2">Tem certeza que deseja {user.role === 'admin' ? 'remover' : 'adicionar'} a função de administrador?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSetRole(user.role === 'admin' ? 'user' : 'admin')}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Banir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  <strong>Usuário:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Função:</strong> {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
                <p className="mt-2">Tem certeza que deseja banir este usuário? Esta ação impedirá que o usuário acesse o sistema.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser} className="bg-red-600 hover:bg-red-700">
              Banir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbanir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  <strong>Usuário:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Função:</strong> {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                </p>
                <p className="mt-2">Tem certeza que deseja desbanir este usuário? O usuário poderá acessar o sistema novamente.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnbanUser} className="bg-green-600 hover:bg-green-700">
              Desbanir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar senha do usuário</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>
                  <strong>Usuário:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="mt-2">Digite a nova senha para o usuário:</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite a nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nova senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirme a nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={!form.formState.isValid}>
                  Alterar senha
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Função',
  },
  {
    accessorKey: 'banned',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('banned') as boolean;
      const label = status ? 'Banido' : 'Ativo';
      return <Badge className={status ? 'bg-red-500' : 'bg-green-500'}>{label}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <UserActions user={row.original} />,
  },
];

interface UsersTableProps {
  data: User[];
  loading: boolean;
}

const UsersTable = ({ data, loading }: UsersTableProps) => {
  const tableData = data.map((user) => ({
    ...user,
  }));

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <DataTable columns={columns} data={tableData} />
    </>
  );
};

export { UsersTable };
