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
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { generateServiceOrder } from '@/lib/utils'
import { toast } from 'sonner';

async function getEvents(): Promise<EventWithRelations[]> {
  const response = await fetch('/api/event');
  if (!response.ok) {
    throw new Error('Erro ao buscar eventos');
  }
  return response.json();
}

export default function Home() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

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
      accessorKey: 'title',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    // {
    //   accessorKey: 'responsiblePerson.companyName',
    //   header: ({ column }) => (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
    //       Empresa
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    // },
    {
      accessorKey: 'responsiblePerson.name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Responsável
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'responsiblePerson.phoneNumber',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Telefone
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
      accessorKey: 'participantsQuantity',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Participantes
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    // {
    //   accessorKey: 'price',
    //   header: ({ column }) => (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
    //       Preço
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => {
    //     return `R$ ${row.original.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    //   },
    // },
    // {
    //   accessorKey: 'serviceFee',
    //   header: ({ column }) => (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
    //       Taxa
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => {
    //     return `${row.original.serviceFee * 100}%`;
    //   },
    // },
    // {
    //   accessorKey: 'total',
    //   header: ({ column }) => (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
    //       Total
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    //   cell: ({ row }) => {
    //     return `R$ ${row.original.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    //   },
    // },
    {
      accessorKey: 'totalWithServiceFee',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return `R$ ${row.original.totalWithServiceFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      accessorKey: 'menu.title',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Cardápio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    // {
    //   accessorKey: 'description',
    //   header: ({ column }) => (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
    //       Observações
    //       <ArrowUpDown className="ml-2 h-4 w-4" />
    //     </Button>
    //   ),
    // },
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
              <DropdownMenuItem onClick={async () => {
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
              <DropdownMenuItem onClick={() => {
                alert('Muita calma! Ainda não implementei isso. Já já vou fazer.');
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
    data: events || [],
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
      <div className="min-h-[calc(100vh-4rem)] p-8 sm:p-20">
        <div className="w-full max-w-6xl mx-auto">
          <Skeleton className="h-8 w-24 mb-6" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Total c/ Taxa</TableHead>
                <TableHead>Cardápio</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="sticky right-0 bg-background z-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pt-20">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Eventos</h1>
          <Input
            placeholder="Buscar..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm ml-2"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {table.getHeaderGroups().map((headerGroup) => (
                headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.id === 'actions' ? 'sticky right-0 bg-background z-10' : ''}
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
                  onClick={() => setSelectedEvent(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === 'actions' ? 'sticky right-0 bg-background z-10' : ''}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o evento
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold">Empresa</h3>
                <p>{selectedEvent.responsiblePerson.companyName}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Responsável</h3>
                <p>{selectedEvent.responsiblePerson.name}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Telefone</h3>
                <p>{selectedEvent.responsiblePerson.phoneNumber}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Local</h3>
                <p>
                  {selectedEvent.location.parent
                    ? `${selectedEvent.location.parent.name} - ${selectedEvent.location.name}`
                    : selectedEvent.location.name}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Data e Hora</h3>
                <p>
                  {format(new Date(selectedEvent.date), "d 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Quantidade de Participantes</h3>
                <p>{selectedEvent.participantsQuantity}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Preço</h3>
                <p>R$ {selectedEvent.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Taxa de Serviço</h3>
                <p>{selectedEvent.serviceFee * 100} %</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Total</h3>
                <p>R$ {selectedEvent.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Total Com Serviço</h3>
                <p>R$ {selectedEvent.totalWithServiceFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              {selectedEvent.title && (
                <div className="space-y-2 col-span-2">
                  <h3 className="font-semibold">Título</h3>
                  <p>{selectedEvent.title}</p>
                </div>
              )}
              {selectedEvent.description && (
                <div className="space-y-2 col-span-2">
                  <h3 className="font-semibold">Observações</h3>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              <div className="space-y-2 col-span-2">
                <h3 className="font-semibold">Cardápio</h3>
                <div className="space-y-4">
                  <p className="font-medium">{selectedEvent.menu.title}</p>
                  {selectedEvent.menu.sections.map((section, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-medium">{section.title}</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {section.items.map((item, itemIndex) => (
                          <li key={itemIndex}>
                            {item.name}
                            {item.description && <span className="text-muted-foreground"> - {item.description}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="font-medium">Preço com Álcool</p>
                      <p>R$ {selectedEvent.menu.priceWithAlcohol.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="font-medium">Preço sem Álcool</p>
                      <p>R$ {selectedEvent.menu.priceWithoutAlcohol.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
