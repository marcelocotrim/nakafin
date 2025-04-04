'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Home, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface Event {
  id: string
  date: string
  contractor: {
    id: string
    name: string
    companyName: string
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
  participantsQuantity: number
  total: number
  totalWithServiceFee: number
}

const MONTHS = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
]

export default function FinancePage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<string>(currentDate.getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString())
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  const fetchEvents = async () => {
    setIsLoadingEvents(true)
    try {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1)
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0)

      const searchParams = new URLSearchParams()
      searchParams.append('status', 'PUBLISHED')
      searchParams.append('startDate', startDate.toISOString())
      searchParams.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/event?${searchParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch events')
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [selectedMonth, selectedYear])

  const totals = {
    people: events.reduce((acc: number, event: Event) => acc + event.participantsQuantity, 0),
    revenue: events.reduce((acc: number, event: Event) => acc + event.totalWithServiceFee, 0),
    service: events.reduce((acc: number, event: Event) => acc + (event.totalWithServiceFee - event.total), 0),
    revenueMinusService: events.reduce((acc: number, event: Event) => acc + event.total, 0),
  }

  const handleExportToExcel = () => {
    if (!events.length) return

    // Group events by location
    const eventsByLocation = events.reduce((acc, event) => {
      const locationKey = event.location.parent
        ? event.location.parent.name
        : event.location.name

      if (!acc[locationKey]) {
        acc[locationKey] = []
      }
      acc[locationKey].push(event)
      return acc
    }, {} as Record<string, Event[]>)

    const wb = XLSX.utils.book_new()

    // Create a sheet for each location
    Object.entries(eventsByLocation).forEach(([locationName, locationEvents]) => {
      type ExcelRow = {
        'DATA': string
        'CONTRATANTE': string
        'EMPRESA': string
        'PREÇO': number | string
        'PAX': number | string
        'VALOR TOTAL': number | string
        'SERVIÇO': number | string
        'VALOR DESCONTADO': number | string
      }

      const data: ExcelRow[] = locationEvents.map(event => ({
        'DATA': format(new Date(event.date), 'dd-MMM', { locale: ptBR }).toUpperCase(),
        'CONTRATANTE': event.contractor.name,
        'EMPRESA': event.contractor.companyName,
        'PREÇO': event.price,
        'PAX': event.participantsQuantity,
        'VALOR TOTAL': event.totalWithServiceFee,
        'SERVIÇO': event.totalWithServiceFee - event.total,
        'VALOR DESCONTADO': event.total,
      }))

      // Add empty rows to match the template
      while (data.length < 15) {
        data.push({
          'DATA': '',
          'CONTRATANTE': '',
          'EMPRESA': '',
          'PREÇO': '',
          'PAX': '',
          'VALOR TOTAL': 0,
          'SERVIÇO': 0,
          'VALOR DESCONTADO': 0,
        })
      }

      // Calculate totals
      const totals = {
        pax: locationEvents.reduce((sum, event) => sum + event.participantsQuantity, 0),
        total: locationEvents.reduce((sum, event) => sum + event.totalWithServiceFee, 0),
        service: locationEvents.reduce((sum, event) => sum + (event.totalWithServiceFee - event.total), 0),
        discounted: locationEvents.reduce((sum, event) => sum + event.total, 0),
      }

      // Add totals row
      data.push({
        'DATA': 'TOTAIS',
        'CONTRATANTE': '',
        'EMPRESA': '',
        'PREÇO': '',
        'PAX': totals.pax,
        'VALOR TOTAL': totals.total,
        'SERVIÇO': totals.service,
        'VALOR DESCONTADO': totals.discounted,
      })

      // Add labels row
      data.push({
        'DATA': '',
        'CONTRATANTE': '',
        'EMPRESA': '',
        'PREÇO': '',
        'PAX': 'PESSOAS',
        'VALOR TOTAL': 'RECEITA',
        'SERVIÇO': 'SERVIÇO',
        'VALOR DESCONTADO': 'RECEITA - SERVIÇO',
      })

      const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false })

      // Set column widths
      const colWidths = [
        { wch: 10 },  // DATA
        { wch: 30 },  // CONTRATANTE
        { wch: 30 },  // EMPRESA
        { wch: 12 },  // PREÇO
        { wch: 8 },   // PAX
        { wch: 15 },  // VALOR TOTAL
        { wch: 15 },  // SERVIÇO
        { wch: 20 },  // VALOR DESCONTADO
      ]
      ws['!cols'] = colWidths

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, locationName)
    })

    // Save the workbook
    XLSX.writeFile(wb, `relatorio-financeiro-${format(new Date(), 'MM-yyyy')}.xlsx`)
  }

  // Generate years array (current year and 2 years back)
  const years = Array.from({ length: 3 }, (_, i) => (currentDate.getFullYear() - i).toString())

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

        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Relatório Financeiro</h1>
      </div>

      <div className="space-y-12">
        {/* Filters Card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4 md:p-6">
            <h3 className="font-medium text-base md:text-lg mb-4">Filtros</h3>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="space-y-2 w-full sm:w-[180px]">
                  <label className="text-xs md:text-sm font-medium">Mês</label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full sm:w-[120px]">
                  <label className="text-xs md:text-sm font-medium">Ano</label>
                  <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleExportToExcel}
                  disabled={isLoadingEvents || events.length === 0}
                  variant="outline"
                  className="w-full sm:w-[200px] text-xs md:text-sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar XLSX
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          <div className="rounded-lg border bg-card p-4 md:p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Total de Pessoas</span>
              <span className="text-lg md:text-2xl font-bold">{totals.people}</span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 md:p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Receita Total</span>
              <span className="text-lg md:text-2xl font-bold">
                {totals.revenue.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 md:p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Total de Serviço</span>
              <span className="text-lg md:text-2xl font-bold">
                {totals.service.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 md:p-6 text-card-foreground shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">Receita Líquida</span>
              <span className="text-lg md:text-2xl font-bold">
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
                <TableHead>Data</TableHead>
                <TableHead>Contratante</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Participantes</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Serviço</TableHead>
                <TableHead className="text-right">Valor Descontado</TableHead>
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
                  const serviceValue = event.totalWithServiceFee - event.total

                  return (
                    <TableRow key={event.id}>
                      <TableCell>{format(new Date(event.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{event.contractor.name}</TableCell>
                      <TableCell>{event.contractor.companyName}</TableCell>
                      <TableCell className="text-right">
                        {event.price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                      <TableCell className="text-right">{event.participantsQuantity}</TableCell>
                      <TableCell className="text-right">
                        {event.totalWithServiceFee.toLocaleString('pt-BR', {
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
                        {event.total.toLocaleString('pt-BR', {
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
