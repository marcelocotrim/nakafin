'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Home, Download } from 'lucide-react'
import { ptBR } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import * as XLSX from 'xlsx'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Person {
  id: string
  name: string
}

interface Event {
  id: string
  date: string
  contractor: {
    id: string
    name: string
  }
  location: {
    id: string
    name: string
    parent?: {
      id: string
      name: string
    } | null
  }
  price: number
  pax: number
}

interface Location {
  id: string
  name: string
  children?: Location[]
}

const fetchEvents = async (filters: {
  startDate?: Date
  endDate?: Date
  contractorId?: string
  locationId?: string
}) => {
  const searchParams = new URLSearchParams()

  searchParams.append('status', 'PUBLISHED')

  if (filters.startDate) {
    searchParams.append('startDate', filters.startDate.toISOString())
  }
  if (filters.endDate) {
    searchParams.append('endDate', filters.endDate.toISOString())
  }
  if (filters.contractorId) {
    searchParams.append('contractorId', filters.contractorId)
  }
  if (filters.locationId) {
    searchParams.append('locationId', filters.locationId)
  }

  const response = await fetch(`/api/event?${searchParams.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch events')
  return response.json()
}

export default function FinancePage() {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [selectedContractor, setSelectedContractor] = useState<string>()
  const [selectedLocation, setSelectedLocation] = useState<string>()
  const [contractors, setContractors] = useState<Person[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: locationsList = [] } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/location')
      if (!response.ok) throw new Error('Failed to fetch locations')
      return response.json()
    },
  })

  const { data: events = [], isLoading: isLoadingEvents, refetch } = useQuery<Event[]>({
    queryKey: ['events', { startDate, endDate, selectedContractor, selectedLocation }],
    queryFn: () => fetchEvents({
      startDate,
      endDate,
      contractorId: selectedContractor,
      locationId: selectedLocation
    }),
    enabled: false,
  })

  const handleSearch = async (value: string) => {
    if (!value) {
      setContractors([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/person/list?search=${value}`)
      if (!response.ok) throw new Error('Failed to fetch contractors')
      const data = await response.json()
      setContractors(data)
    } catch (error) {
      console.error('Error fetching contractors:', error)
    } finally {
      setLoading(false)
    }
  }

  const totals = {
    people: events.reduce((acc: number, event: Event) => acc + event.pax, 0),
    revenue: events.reduce((acc: number, event: Event) => acc + (event.price * event.pax), 0),
    service: events.reduce((acc: number, event: Event) => acc + (event.price * event.pax * 0.1), 0),
    revenueMinusService: events.reduce((acc: number, event: Event) => {
      const total = event.price * event.pax
      return acc + (total - (total * 0.1))
    }, 0),
  }

  const handleExportToExcel = () => {
    if (!events.length) return

    const exportData = events.map(event => {
      const totalValue = event.price * event.pax
      const serviceValue = totalValue * 0.1
      const discountedValue = totalValue - serviceValue

      return {
        'Data': format(new Date(event.date), 'dd/MM/yyyy'),
        'Contratante': event.contractor.name,
        'Empresa': event.location.parent
          ? `${event.location.parent.name} - ${event.location.name}`
          : event.location.name,
        'Preço': event.price,
        'Pax': event.pax,
        'Valor Total': totalValue,
        'Serviço': serviceValue,
        'Valor Descontado': discountedValue
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório Financeiro')
    XLSX.writeFile(wb, `relatorio-financeiro-${format(new Date(), 'dd-MM-yyyy')}.xlsx`)
  }

  return (
    <div className="container mx-auto p-4">
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
            <BreadcrumbPage>Financeiro</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-semibold tracking-tight">Relatório Financeiro</h1>
      </div>

      <div className="space-y-12">
        {/* Filters Card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="font-medium text-lg mb-4">Filtros</h3>
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
                  <label className="text-sm font-medium">Contratante</label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedContractor
                          ? contractors.find((c) => c.id === selectedContractor)?.name
                          : "Selecione um contratante"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar contratante..."
                          onValueChange={handleSearch}
                        />
                        <CommandEmpty>
                          {loading ? 'Carregando...' : 'Nenhum contratante encontrado'}
                        </CommandEmpty>
                        <CommandGroup>
                          {contractors.map((contractor) => (
                            <CommandItem
                              key={contractor.id}
                              value={contractor.id}
                              onSelect={(value) => {
                                setSelectedContractor(value === selectedContractor ? undefined : value)
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedContractor === contractor.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {contractor.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Restaurante</label>
                  <Select
                    value={selectedLocation}
                    onValueChange={(value) => setSelectedLocation(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um restaurante" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsList.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  onClick={handleExportToExcel}
                  disabled={isLoadingEvents || events.length === 0}
                  variant="outline"
                  className="w-[200px]"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar XLSX
                </Button>
                <Button
                  onClick={() => refetch()}
                  disabled={isLoadingEvents}
                  className="w-[200px]"
                >
                  {isLoadingEvents ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Total de Pessoas</span>
              <span className="text-2xl font-bold">{totals.people}</span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Receita Total</span>
              <span className="text-2xl font-bold">
                {totals.revenue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Total de Serviço</span>
              <span className="text-2xl font-bold">
                {totals.service.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Receita Líquida</span>
              <span className="text-2xl font-bold">
                {totals.revenueMinusService.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DATA</TableHead>
                <TableHead>CONTRATANTE</TableHead>
                <TableHead>EMPRESA</TableHead>
                <TableHead className="text-right">PREÇO</TableHead>
                <TableHead className="text-right">PAX</TableHead>
                <TableHead className="text-right">VALOR TOTAL</TableHead>
                <TableHead className="text-right">SERVIÇO</TableHead>
                <TableHead className="text-right">VALOR DESCONTADO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {isLoadingEvents ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-sm text-muted-foreground">Carregando...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm text-muted-foreground">Nenhum registro encontrado</span>
                        <span className="text-xs text-muted-foreground">Ajuste os filtros e tente novamente</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => {
                  const totalValue = event.price * event.pax
                  const serviceValue = totalValue * 0.1
                  const discountedValue = totalValue - serviceValue

                  return (
                    <TableRow key={event.id}>
                      <TableCell>{format(new Date(event.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{event.contractor.name}</TableCell>
                      <TableCell>
                        {event.location.parent
                          ? `${event.location.parent.name} - ${event.location.name}`
                          : event.location.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {event.price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                      <TableCell className="text-right">{event.pax}</TableCell>
                      <TableCell className="text-right">
                        {totalValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {serviceValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {discountedValue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
