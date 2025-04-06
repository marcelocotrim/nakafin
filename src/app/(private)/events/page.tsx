'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventWithRelations } from '@/types/event';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ArrowUpDown, MoreHorizontal, Home, Calendar as CalendarIcon, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateServiceOrder } from '@/lib/utils'
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

async function getEvents(filters?: { startDate?: Date; endDate?: Date }): Promise<EventWithRelations[]> {
  const searchParams = new URLSearchParams();

  if (filters?.startDate) {
    searchParams.append('startDate', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    searchParams.append('endDate', filters.endDate.toISOString());
  }

  const queryString = searchParams.toString();
  const url = `/api/event${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erro ao buscar eventos');
  }
  return response.json();
}

export default function EventsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [eventToCancel, setEventToCancel] = useState<EventWithRelations | null>(null);
  const [eventToUncancel, setEventToUncancel] = useState<EventWithRelations | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const router = useRouter();

  const cancelEventMutation = useMutation({
    mutationFn: async (event: EventWithRelations) => {
      const response = await fetch(`/api/event/${event.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: 'CANCELLED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Evento cancelado com sucesso!');
      refetch();
    },
    onError: (error) => {
      console.error('Error canceling event:', error);
      toast.error('Erro ao cancelar evento');
    },
  });

  const confirmEventMutation = useMutation({
    mutationFn: async (event: EventWithRelations) => {
      const response = await fetch(`/api/event/${event.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: 'CONFIRMED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm event');
      }

      return response.json();
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Error confirming event:', error);
      toast.error('Erro ao confirmar evento');
    },
  });

  const uncancelEventMutation = useMutation({
    mutationFn: async (event: EventWithRelations) => {
      const response = await fetch(`/api/event/${event.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: 'PUBLISHED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to uncancel event');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Cancelamento desfeito com sucesso!');
      refetch();
    },
    onError: (error) => {
      console.error('Error uncanceling event:', error);
      toast.error('Erro ao desfazer cancelamento');
    },
  });

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events', startDate, endDate],
    queryFn: () => getEvents({
      startDate: startDate,
      endDate: endDate,
    }),
  });

  // Remove the useMemo since we're now filtering on the backend
  const filteredEvents = events || [];

  const handleSearch = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    refetch();
  };

  // Function to get status badge variant and translated text
  const getStatusBadge = (status: string, date: Date | string) => {
    // Convert status to uppercase for case-insensitive comparison
    const statusUpper = status.toUpperCase();
    const isPastEvent = new Date(date) < new Date();

    switch (statusUpper) {
      case 'PENDING':
        return {
          variant: 'secondary' as const,
          text: 'Pendente'
        };
      case 'CONFIRMED':
        return {
          variant: 'default' as const,
          text: 'Confirmado',
          className: 'bg-green-600 text-white border-green-600'
        };
      case 'CANCELLED':
        return {
          variant: 'destructive' as const,
          text: 'Cancelado'
        };
      case 'COMPLETED':
        return {
          variant: 'default' as const,
          text: 'Concluído'
        };
      case 'DRAFT':
        return {
          variant: 'outline' as const,
          text: 'Rascunho'
        };
      case 'PUBLISHED':
        if (isPastEvent) {
          return {
            variant: 'outline' as const,
            text: 'Encerrado',
            className: 'bg-gray-100 text-gray-600 border-gray-300'
          };
        }
        return {
          variant: 'default' as const,
          text: 'Publicado'
        };
      default:
        return {
          variant: 'outline' as const,
          text: status
        };
    }
  };

  const handleCancelEvent = async (event: EventWithRelations) => {
    try {
      await cancelEventMutation.mutateAsync(event);
      setEventToCancel(null);
    } catch (error) {
      console.error('Error canceling event:', error);
    }
  };

  const handleUncancelEvent = async (event: EventWithRelations) => {
    try {
      await uncancelEventMutation.mutateAsync(event);
      setEventToUncancel(null);
    } catch (error) {
      console.error('Error uncanceling event:', error);
    }
  };

  const columns: ColumnDef<EventWithRelations>[] = [
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return format(new Date(row.original.date), "dd/MM/yyyy HH:mm", { locale: ptBR });
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const { variant, text, className } = getStatusBadge(status, row.original.date);
        return <Badge variant={variant} className={className}>{text}</Badge>;
      },
    },
    {
      accessorKey: 'user.name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Usuário
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'location',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Local
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const location = row.original.location;
        return location.parent ? `${location.parent.name} - ${location.name}` : location.name;
      },
    },
    {
      accessorKey: 'contractor',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Contratante
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const contractor = row.original.contractor;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{contractor.name}</span>
            <span className="text-sm text-muted-foreground">{contractor.phoneNumber}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Criado em
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR });
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Ações disponíveis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                Ações
              </div>
              <div className="h-px bg-border my-1" />
              {row.original.status !== 'CANCELLED' && (
                <DropdownMenuItem onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // Fetch the template file
                    const response = await fetch('/templates/ordem-servico.docx')
                    if (!response.ok) {
                      throw new Error('Template não encontrado')
                    }
                    const blob = await response.blob()
                    const templateFile = new File([blob], 'ordem-servico.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

                    // Generate the service order
                    await generateServiceOrder(templateFile, row.original)

                    // Automatically confirm the event after generating the OS
                    if (row.original.status === 'PUBLISHED') {
                      await confirmEventMutation.mutateAsync(row.original);
                      toast.success('OS gerada e evento confirmado com sucesso!');
                    } else {
                      toast.success('OS gerada com sucesso!');
                    }
                  } catch (error) {
                    console.error('Error generating service order:', error)
                    toast.error('Erro ao gerar ordem de serviço')
                  }
                }}>
                  Gerar OS
                </DropdownMenuItem>
              )}
              {new Date(row.original.date) > new Date() && row.original.status !== 'CANCELLED' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEventToCancel(row.original);
                  }}
                  className="text-destructive"
                >
                  Cancelar Evento
                </DropdownMenuItem>
              )}
              {row.original.status === 'CANCELLED' && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEventToUncancel(row.original);
                  }}
                  className="text-green-600"
                >
                  Desfazer Cancelamento
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredEvents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
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
              <BreadcrumbPage>Eventos</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <h1 className="text-2xl font-bold">Eventos</h1>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </div>
        </div>

        {/* Filters Card Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[120px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-md overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="whitespace-nowrap"><Skeleton className="h-4 w-24" /></TableHead>
                  <TableHead className="whitespace-nowrap sticky right-0 bg-background z-10"><Skeleton className="h-4 w-8" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell className="sticky right-0 bg-background z-10">
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4">
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
              <BreadcrumbPage>Eventos</BreadcrumbPage>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <h1 className="text-2xl font-bold">Eventos</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => window.location.href = '/events/new'}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Evento
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, 'dd/MM/yyyy')
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                >
                  Limpar filtros
                </Button>
                <Button
                  onClick={handleSearch}
                >
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border rounded-md overflow-hidden w-full">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {table.getHeaderGroups().map((headerGroup) => (
                    headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn(
                          header.id === 'actions' ? 'sticky right-0 bg-background z-10' : '',
                          'whitespace-nowrap'
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/events/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            cell.column.id === 'actions' ? 'sticky right-0 bg-background z-10' : '',
                            'whitespace-nowrap'
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 p-6">
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <AlertDialog open={!!eventToCancel} onOpenChange={() => setEventToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Evento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este evento? Esta ação não pode ser desfeita.
              {eventToCancel && (
                <div className="mt-2">
                  <p><strong>Evento:</strong> {eventToCancel.title || 'Sem título'}</p>
                  <p><strong>Data:</strong> {format(new Date(eventToCancel.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  <p><strong>Local:</strong> {eventToCancel.location?.name}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter evento</AlertDialogCancel>
            <Button
              onClick={() => eventToCancel && handleCancelEvent(eventToCancel)}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              Sim, cancelar evento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!eventToUncancel} onOpenChange={() => setEventToUncancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer Cancelamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desfazer o cancelamento deste evento?
              {eventToUncancel && (
                <div className="mt-2">
                  <p><strong>Evento:</strong> {eventToUncancel.title || 'Sem título'}</p>
                  <p><strong>Data:</strong> {format(new Date(eventToUncancel.date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                  <p><strong>Local:</strong> {eventToUncancel.location?.name}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter cancelado</AlertDialogCancel>
            <Button
              onClick={() => eventToUncancel && handleUncancelEvent(eventToUncancel)}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-600/10"
            >
              Sim, desfazer cancelamento
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
