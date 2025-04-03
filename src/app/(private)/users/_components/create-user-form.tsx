'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { admin } from '@/lib/auth-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/utils/error-handler';

const createUserFormSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  email: z.string().email({
    message: 'Por favor, insira um e-mail válido.',
  }),
  role: z.enum(['admin', 'user'], {
    message: 'Por favor, selecione um cargo válido.',
  }),
});

type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export const CreateUserForm = ({ onSuccess }: CreateUserFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'user',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (values: CreateUserFormValues) => {
      await admin.createUser(
        {
          name: values.name,
          email: values.email,
          role: values.role,
          password: 'password123',
        },
        {
          onError: (error) => {
            throw error;
          },
        }
      );
    },
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    }
  });

  async function onSubmit(values: CreateUserFormValues) {
    createUserMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="seu@email.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={createUserMutation.isPending}
        >
          {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Usuário
        </Button>
      </form>
    </Form>
  );
};
