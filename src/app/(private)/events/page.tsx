'use client';

import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { ArrowUpDown, MoreHorizontal, Home, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateServiceOrder } from '@/lib/utils'
import { toast } from 'sonner';
import { addEventToGoogleCalendar } from '@/lib/google-calendar';
import { useGoogleLogin } from '@react-oauth/google';
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

async function getEvents(filters?: { startDate?: Date; endDate?: Date; search?: string }): Promise<EventWithRelations[]> {
  const searchParams = new URLSearchParams();

  if (filters?.startDate) {
    searchParams.append('startDate', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    searchParams.append('endDate', filters.endDate.toISOString());
  }
  if (filters?.search) {
    searchParams.append('search', filters.search);
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
  const [globalFilter, setGlobalFilter] = useState('');
  const [eventToAdd, setEventToAdd] = useState<EventWithRelations | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const router = useRouter();

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar',
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        await addEventToGoogleCalendar(eventToAdd!, tokenResponse.access_token);
        toast.success('Evento adicionado ao Google Calendar com sucesso!');
        setEventToAdd(null)
      } catch (error) {
        console.error('Error adding to Google Calendar:', error);
        toast.error('Erro ao adicionar evento ao Google Calendar');
      }
    },
  });

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events', startDate, endDate, globalFilter],
    queryFn: () => getEvents({
      startDate: startDate,
      endDate: endDate,
      search: globalFilter || undefined
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
    setGlobalFilter('');
    refetch();
  };

  // Function to get status badge variant and translated text
  const getStatusBadge = (status: string) => {
    // Convert status to uppercase for case-insensitive comparison
    const statusUpper = status.toUpperCase();

    switch (statusUpper) {
      case 'PENDING':
        return {
          variant: 'outline' as const,
          text: 'Pendente'
        };
      case 'CONFIRMED':
        return {
          variant: 'default' as const,
          text: 'Confirmado'
        };
      case 'CANCELLED':
        return {
          variant: 'destructive' as const,
          text: 'Cancelado'
        };
      case 'COMPLETED':
        return {
          variant: 'secondary' as const,
          text: 'Concluído'
        };
      case 'DRAFT':
        return {
          variant: 'outline' as const,
          text: 'Rascunho'
        };
      default:
        return {
          variant: 'outline' as const,
          text: status
        };
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
        const { variant, text } = getStatusBadge(status);
        return <Badge variant={variant}>{text}</Badge>;
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
            <DropdownMenuContent align="end">
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
                } catch (error) {
                  console.error('Error generating service order:', error)
                  toast.error('Erro ao gerar ordem de serviço')
                }
              }}>
                Gerar Ordem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setEventToAdd(row.original);
                login();
              }}>
                Adicionar ao Google Calendar
              </DropdownMenuItem>
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
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
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
            <h1 className="text-2xl font-bold">Eventos</h1>
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
            <h1 className="text-2xl font-bold">Eventos</h1>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Buscar..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(String(event.target.value))}
                className="max-w-sm"
              />
              <Button onClick={() => window.location.href = '/events/new'}>
                Criar Evento
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Buscar..."
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(String(event.target.value))}
                    className="w-full"
                  />
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
    </>
  );
}
