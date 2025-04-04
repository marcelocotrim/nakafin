'use client'

import { useState, useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import {
  Home,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Percent,
  Wallet,
  Filter,
  MapPin,
  Building2,
  Receipt,
  PieChart
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { ptBR } from 'date-fns/locale'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useQuery } from '@tanstack/react-query'

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

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

const QUICK_PERIODS = [
  { value: 'this-month', label: 'Este Mês' },
  { value: 'last-month', label: 'Mês Anterior' },
  { value: 'last-3-months', label: 'Últimos 3 Meses' },
  { value: 'this-year', label: 'Este Ano' },
  { value: 'last-year', label: 'Ano Anterior' },
]

async function fetchEvents(startDate: Date, endDate: Date): Promise<Event[]> {
  const searchParams = new URLSearchParams()
  searchParams.append('status', 'PUBLISHED')
  searchParams.append('startDate', startDate.toISOString())
  searchParams.append('endDate', endDate.toISOString())

  const response = await fetch(`/api/event?${searchParams.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch events')
  return response.json()
}

export default function FinancePage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<string>(currentDate.getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString())
  const [selectedQuickPeriod, setSelectedQuickPeriod] = useState<string>('this-month')
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Calculate date ranges
  const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1)
  const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0)
  const previousStartDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1)
  const previousEndDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0)

  // Fetch current period events
  const {
    data: events = [],
    isLoading: isLoadingEvents,
  } = useQuery({
    queryKey: ['events', selectedMonth, selectedYear],
    queryFn: () => fetchEvents(startDate, endDate),
  })

  // Fetch previous period events
  const {
    data: previousEvents = [],
  } = useQuery({
    queryKey: ['events', 'previous', selectedMonth, selectedYear],
    queryFn: () => fetchEvents(previousStartDate, previousEndDate),
  })

  // Compute sorted events based on current sort config
  const sortedEvents = useMemo(() => {
    if (!sortConfig) return events

    return [...events].sort((a, b) => {
      const { key, direction } = sortConfig

      if (key === 'date') {
        return direction === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (key === 'contractor') {
        return direction === 'asc'
          ? a.contractor.name.localeCompare(b.contractor.name)
          : b.contractor.name.localeCompare(a.contractor.name)
      } else if (key === 'company') {
        return direction === 'asc'
          ? a.contractor.companyName.localeCompare(b.contractor.companyName)
          : b.contractor.companyName.localeCompare(a.contractor.companyName)
      } else if (key === 'price') {
        return direction === 'asc'
          ? a.price - b.price
          : b.price - a.price
      } else if (key === 'participants') {
        return direction === 'asc'
          ? a.participantsQuantity - b.participantsQuantity
          : b.participantsQuantity - a.participantsQuantity
      } else if (key === 'total') {
        return direction === 'asc'
          ? a.totalWithServiceFee - b.totalWithServiceFee
          : b.totalWithServiceFee - a.totalWithServiceFee
      } else if (key === 'service') {
        return direction === 'asc'
          ? (a.totalWithServiceFee - a.total) - (b.totalWithServiceFee - b.total)
          : (b.totalWithServiceFee - b.total) - (a.totalWithServiceFee - a.total)
      } else if (key === 'discounted') {
        return direction === 'asc'
          ? a.total - b.total
          : b.total - a.total
      }

      return 0
    })
  }, [events, sortConfig])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }

    setSortConfig({ key, direction })
  }

  const totals = {
    people: events.reduce((acc: number, event: Event) => acc + event.participantsQuantity, 0),
    revenue: events.reduce((acc: number, event: Event) => acc + event.totalWithServiceFee, 0),
    service: events.reduce((acc: number, event: Event) => acc + (event.totalWithServiceFee - event.total), 0),
    revenueMinusService: events.reduce((acc: number, event: Event) => acc + event.total, 0),
  }

  const previousTotals = {
    people: previousEvents.reduce((acc: number, event: Event) => acc + event.participantsQuantity, 0),
    revenue: previousEvents.reduce((acc: number, event: Event) => acc + event.totalWithServiceFee, 0),
    service: previousEvents.reduce((acc: number, event: Event) => acc + (event.totalWithServiceFee - event.total), 0),
    revenueMinusService: previousEvents.reduce((acc: number, event: Event) => acc + event.total, 0),
  }

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true }
    const percentage = ((current - previous) / previous) * 100
    return { value: Math.abs(percentage), isPositive: percentage >= 0 }
  }

  const peopleTrend = calculateTrend(totals.people, previousTotals.people)
  const revenueTrend = calculateTrend(totals.revenue, previousTotals.revenue)
  const serviceTrend = calculateTrend(totals.service, previousTotals.service)
  const revenueMinusServiceTrend = calculateTrend(totals.revenueMinusService, previousTotals.revenueMinusService)

  // Group events by location with proper typing
  const eventsByLocation = events.reduce((acc: Record<string, Event[]>, event: Event) => {
    const locationKey = event.location.parent
      ? event.location.parent.name
      : event.location.name

    if (!acc[locationKey]) {
      acc[locationKey] = []
    }
    acc[locationKey].push(event)
    return acc
  }, {} as Record<string, Event[]>)

  // Update the period label logic
  const getPeriodLabel = () => {
    switch (selectedQuickPeriod) {
      case 'this-month':
      case 'last-month':
        return `${selectedMonthLabel} ${selectedYear}`
      case 'last-3-months': {
        const today = new Date()
        const threeMonthsAgo = subMonths(today, 2)
        const startMonth = MONTHS[threeMonthsAgo.getMonth()].label
        const endMonth = MONTHS[today.getMonth()].label
        return `${startMonth} - ${endMonth} ${today.getFullYear()}`
      }
      case 'this-year':
        return `Ano ${selectedYear}`
      case 'last-year':
        return `Ano ${selectedYear}`
      default:
        return `${selectedMonthLabel} ${selectedYear}`
    }
  }

  const handleQuickPeriodChange = (value: string) => {
    setSelectedQuickPeriod(value)

    const today = new Date()

    switch (value) {
      case 'this-month':
        setSelectedMonth(today.getMonth().toString())
        setSelectedYear(today.getFullYear().toString())
        break
      case 'last-month':
        const lastMonth = subMonths(today, 1)
        setSelectedMonth(lastMonth.getMonth().toString())
        setSelectedYear(lastMonth.getFullYear().toString())
        break
      case 'last-3-months':
        // Keep the current month as the end date
        setSelectedMonth(today.getMonth().toString())
        setSelectedYear(today.getFullYear().toString())
        break
      case 'this-year':
        // Keep January as start date but update the display
        setSelectedMonth('0')
        setSelectedYear(today.getFullYear().toString())
        break
      case 'last-year':
        setSelectedMonth('0')
        setSelectedYear((today.getFullYear() - 1).toString())
        break
    }
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

  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || ''

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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Relatório Financeiro</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{getPeriodLabel()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filters Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-base md:text-lg">Filtros</CardTitle>
            </div>
            <CardDescription>Selecione o período para visualizar os dados financeiros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Mês e Ano</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="space-y-2 w-full sm:w-[180px]">
                    <label className="text-xs text-muted-foreground">Mês</label>
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
                    <label className="text-xs text-muted-foreground">Ano</label>
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
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Período Rápido</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-full sm:w-[240px]">
                    <Select
                      value={selectedQuickPeriod}
                      onValueChange={handleQuickPeriodChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um período" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUICK_PERIODS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
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
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Total de Pessoas</p>
                    </div>
                    <p className="text-lg font-semibold">{totals.people}</p>
                  </div>
                  <div className={`flex items-center ${peopleTrend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {peopleTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-xs ml-1">{peopleTrend.value.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Receita Total</p>
                    </div>
                    <p className="text-lg font-semibold">
                      {totals.revenue.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <div className={`flex items-center ${revenueTrend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-xs ml-1">{revenueTrend.value.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Total de Serviço</p>
                    </div>
                    <p className="text-lg font-semibold">
                      {totals.service.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <div className={`flex items-center ${serviceTrend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {serviceTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-xs ml-1">{serviceTrend.value.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Receita Líquida</p>
                    </div>
                    <p className="text-lg font-semibold">
                      {totals.revenueMinusService.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                  <div className={`flex items-center ${revenueMinusServiceTrend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueMinusServiceTrend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="text-xs ml-1">{revenueMinusServiceTrend.value.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Location Summary */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <CardTitle className="text-sm font-medium">Resumo por Local</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {Object.entries(eventsByLocation).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
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
                    </div>
                  ) : (
                    Object.entries(eventsByLocation).map(([locationName, locationEvents]) => {
                      const locationTotals = {
                        people: locationEvents.reduce((sum, event) => sum + event.participantsQuantity, 0),
                        revenue: locationEvents.reduce((sum, event) => sum + event.totalWithServiceFee, 0),
                        service: locationEvents.reduce((sum, event) => sum + (event.totalWithServiceFee - event.total), 0),
                        discounted: locationEvents.reduce((sum, event) => sum + event.total, 0),
                      }

                      return (
                        <div key={locationName} className="border rounded-lg p-3">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <h3 className="text-sm font-medium">{locationName}</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8">
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">{locationTotals.people}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Total de Pessoas</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">
                                        {locationTotals.revenue.toLocaleString('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        })}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Receita Total</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <Percent className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">
                                        {locationTotals.service.toLocaleString('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        })}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Total de Serviço</p>
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <Wallet className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm">
                                        {locationTotals.discounted.toLocaleString('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        })}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Receita Líquida</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            {/* Results Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Detalhes dos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                          <div className="flex items-center">
                            Data
                            {sortConfig?.key === 'date' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('contractor')}>
                          <div className="flex items-center">
                            Contratante
                            {sortConfig?.key === 'contractor' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('company')}>
                          <div className="flex items-center">
                            Empresa
                            {sortConfig?.key === 'company' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => handleSort('price')}>
                          <div className="flex items-center justify-end">
                            Preço
                            {sortConfig?.key === 'price' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => handleSort('participants')}>
                          <div className="flex items-center justify-end">
                            Participantes
                            {sortConfig?.key === 'participants' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => handleSort('total')}>
                          <div className="flex items-center justify-end">
                            Valor Total
                            {sortConfig?.key === 'total' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => handleSort('service')}>
                          <div className="flex items-center justify-end">
                            Serviço
                            {sortConfig?.key === 'service' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer" onClick={() => handleSort('discounted')}>
                          <div className="flex items-center justify-end">
                            Valor Descontado
                            {sortConfig?.key === 'discounted' && (
                              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                            )}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEvents.length === 0 ? (
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
                        sortedEvents.map((event) => {
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
