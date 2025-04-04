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
      event.status === 'PUBLISHED';
  }) || [];

  const currentMonthEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfMonth(today) &&
      eventDate <= endOfMonth(today) &&
      event.status === 'PUBLISHED';
  }) || [];

  const lastMonthEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfMonth(lastMonth) &&
      eventDate <= endOfMonth(lastMonth) &&
      event.status === 'PUBLISHED';
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

  // Create a Set of dates that have published events
  const eventDates = new Set(
    events?.filter(event => event.status === 'PUBLISHED')
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
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="w-full flex-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-4xl font-bold">
                R$ {currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className={cn(
                "text-sm",
                revenueChange >= 0 ? "text-green-500" : "text-red-500"
              )}>
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
            <CardTitle className="text-sm font-medium">Eventos do Mês</CardTitle>
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
            <CardTitle className="text-sm font-medium">Calendário e Eventos Confirmados</CardTitle>
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
                  }}
                  modifiersStyles={{
                    hasEvent: {
                      backgroundColor: 'rgb(34 197 94)',
                      color: 'white',
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
                      <div
                        key={event.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer gap-2 sm:gap-4",
                          format(new Date(event.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "border-[rgb(34_197_94)]"
                        )}
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <div className="space-y-1 sm:space-y-2">
                          <div>
                            <h3 className="font-medium text-base sm:text-lg">{event.title || 'Sem título'}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {format(new Date(event.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                                ? `Hoje às ${format(new Date(event.date), 'HH:mm')}`
                                : format(new Date(event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                              <span className="truncate max-w-[200px] sm:max-w-none">{event.location.parent ? `${event.location.parent.name} - ${event.location.name}` : event.location.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              <span className="truncate max-w-[150px] sm:max-w-none">{event.contractor.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                              <a
                                href={`https://wa.me/${event.contractor.phoneNumber.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {event.contractor.phoneNumber}
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="text-right mt-2 sm:mt-0">
                          <p className="font-medium text-base sm:text-lg">
                            R$ {event.totalWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {event.participantsQuantity} participantes
                          </p>
                        </div>
                      </div>
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
          <CardTitle>Meus Rascunhos</CardTitle>
        </CardHeader>
        <CardContent>
          {userDrafts.length > 0 ? (
            <div className="space-y-4">
              {userDrafts.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer gap-2 sm:gap-4",
                    format(new Date(event.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "border-[rgb(34_197_94)]"
                  )}
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="space-y-1 sm:space-y-2">
                    <div>
                      <h3 className="font-medium text-base sm:text-lg">{event.title || 'Sem título'}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(event.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                          ? `Hoje às ${format(new Date(event.date), 'HH:mm')}`
                          : format(new Date(event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span className="truncate max-w-[200px] sm:max-w-none">{event.location.parent ? `${event.location.parent.name} - ${event.location.name}` : event.location.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <span className="truncate max-w-[150px] sm:max-w-none">{event.contractor.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        <a
                          href={`https://wa.me/${event.contractor.phoneNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.contractor.phoneNumber}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="font-medium text-base sm:text-lg">
                      R$ {event.totalWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {event.participantsQuantity} participantes
                    </p>
                  </div>
                </div>
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
