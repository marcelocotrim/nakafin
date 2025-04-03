'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { EventWithRelations } from '@/types/event';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

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
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  const today = new Date();
  const todayEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfDay(today) && eventDate <= endOfDay(today);
  }) || [];

  const currentMonthEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfMonth(today) && eventDate <= endOfMonth(today);
  }) || [];

  const currentMonthRevenue = currentMonthEvents.reduce((total, event) => {
    return total + (event.totalWithServiceFee || 0);
  }, 0);

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
      <div className="flex flex-row gap-4">
        <Card className="w-full flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full flex-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEvents.length}</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col lg:flex-row gap-4">

        <Card className="w-full flex-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={today}
              className="rounded-md border"
              locale={ptBR}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length > 0 ? (
            <div className="space-y-4">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{event.title || 'Sem título'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {event.totalWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.participantsQuantity} participantes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum evento hoje</p>
          )}
        </CardContent>
      </Card>

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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-medium">{event.title || 'Sem título'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                        <span>{event.location.parent ? `${event.location.parent.name} - ${event.location.name}` : event.location.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <span>{event.contractor.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        <span>{event.contractor.phoneNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      R$ {event.totalWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
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
