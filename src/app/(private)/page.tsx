'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { EventWithRelations } from '@/types/event';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';
import { Home as HomeIcon, DollarSign, Calendar as CalendarIcon, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { EventCard } from '@/app/(private)/_components/event-card';

async function getEvents(): Promise<EventWithRelations[]> {
  const response = await fetch('/api/event');
  if (!response.ok) {
    throw new Error('Erro ao buscar eventos');
  }
  return response.json();
}

function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  const today = new Date();
  const lastMonth = subMonths(today, 1);

  const selectedDateEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfDay(selectedDate) &&
      eventDate <= endOfDay(selectedDate) &&
      event.status === 'CONFIRMED';
  }) || [];

  const currentMonthEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfMonth(today) &&
      eventDate <= endOfMonth(today) &&
      event.status === 'CONFIRMED';
  }) || [];

  const lastMonthEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfMonth(lastMonth) &&
      eventDate <= endOfMonth(lastMonth) &&
      event.status === 'CONFIRMED';
  }) || [];

  const eventsChange = lastMonthEvents.length ? ((currentMonthEvents.length - lastMonthEvents.length) / lastMonthEvents.length) * 100 : 0;

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Process daily revenue data for the current month
  const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayEvents = currentMonthEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day;
    });
    const revenue = dayEvents.reduce((total, event) => total + (event.totalWithServiceFee || 0), 0);
    return {
      day,
      revenue
    };
  });

  const currentMonthRevenue = currentMonthEvents.reduce((total, event) => {
    return total + (event.totalWithServiceFee || 0);
  }, 0);

  const lastMonthRevenue = lastMonthEvents.reduce((total, event) => {
    return total + (event.totalWithServiceFee || 0);
  }, 0);

  const revenueChange = lastMonthRevenue ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  // Process daily events data for the current month
  const dailyEvents = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const eventsForDay = currentMonthEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day;
    });
    return {
      day,
      events: eventsForDay.length
    };
  });

  // Create a Set of dates that have confirmed events
  const eventDates = new Set(
    events?.filter(event => event.status === 'CONFIRMED')
      .map(event => format(new Date(event.date), 'yyyy-MM-dd')) || []
  );

  // Filter drafts for the logged user
  const userDrafts = events?.filter(event =>
    event.status === 'DRAFT' && event.userId === session?.user?.id
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="w-full flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
          <Card className="w-full flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
          <Card className="w-full flex-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Meus Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <HomeIcon className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="w-full flex-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-4xl font-bold">
                R$ {currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className={cn(
                "text-sm flex items-center gap-1",
                revenueChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {revenueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}% em relação ao mês anterior
              </div>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-card p-2 shadow-sm">
                            <div className="text-sm font-medium">
                              {format(new Date(today.getFullYear(), today.getMonth(), data.day), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    minPointSize={3}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full flex-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Eventos do Mês</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-4xl font-bold">
                {currentMonthEvents.length}
              </div>
              <div className={cn(
                "text-sm",
                eventsChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {eventsChange >= 0 ? "+" : ""}{eventsChange.toFixed(1)}% em relação ao mês anterior
              </div>
            </div>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyEvents} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-card p-2 shadow-sm">
                            <div className="text-sm mb-1">
                              {format(new Date(today.getFullYear(), today.getMonth(), data.day), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <span className="text-sm">Eventos</span>
                              <span className="text-sm font-bold">{data.events}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="rgb(34 197 94)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="w-full flex-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <CardTitle className="text-sm font-medium">Calendário e Eventos Confirmados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-[280px] shrink-0 flex justify-center lg:justify-start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  locale={ptBR}
                  modifiers={{
                    hasEvent: (date) => eventDates.has(format(date, 'yyyy-MM-dd')),
                    pastEvent: (date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today && eventDates.has(format(date, 'yyyy-MM-dd'));
                    }
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      backgroundColor: 'rgb(34 197 94)',
                      color: 'white',
                      fontWeight: 'bold',
                      borderRadius: '6px',
                    },
                    pastEvent: {
                      backgroundColor: 'rgb(187 247 208)',
                      color: 'rgb(21 128 61)',
                      fontWeight: 'bold',
                      borderRadius: '6px',
                    }
                  }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-4">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onClick={() => router.push(`/events/${event.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum evento hoje</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <CardTitle>Meus Rascunhos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {userDrafts.length > 0 ? (
            <div className="space-y-4">
              {userDrafts.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Você não tem rascunhos de eventos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Home;
