'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Person } from '@/types/person';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const personSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  phoneNumber: z.string().min(10, {
    message: 'O número de telefone deve ter pelo menos 10 caracteres.',
  }),
  companyName: z.string().min(2, {
    message: 'O nome da empresa deve ter pelo menos 2 caracteres.',
  }),
});

type PersonFormValues = z.infer<typeof personSchema>;

interface PersonInputProps {
  value: string;
  onChange: (value: string, id?: string) => void;
}

export function PersonInput({ value, onChange }: PersonInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: persons = [] } = useQuery<Person[]>({
    queryKey: ['persons', search],
    queryFn: async () => {
      const response = await fetch(`/api/person?search=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch persons');
      }
      return response.json();
    },
    enabled: search.length > 0,
  });

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      companyName: '',
    },
  });

  const createPersonMutation = useMutation({
    mutationFn: async (values: PersonFormValues) => {
      const response = await fetch('/api/person', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create person');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Pessoa criada com sucesso!');
      onChange(data.name, data.id);
      setOpen(false);
      setDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['persons'] });
    },
    onError: () => {
      toast.error('Erro ao criar pessoa. Tente novamente.');
    },
  });

  function onSubmit(values: PersonFormValues) {
    createPersonMutation.mutate(values);
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value || "Selecione uma pessoa..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar pessoa..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
              <CommandGroup>
                {persons.map((person) => (
                  <CommandItem
                    key={person.id}
                    value={person.name}
                    onSelect={() => {
                      onChange(person.name, person.id);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === person.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {person.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pessoa</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova pessoa
            </DialogDescription>
          </DialogHeader>
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
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de telefone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createPersonMutation.isPending}>
                  {createPersonMutation.isPending ? 'Criando...' : 'Criar Pessoa'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 