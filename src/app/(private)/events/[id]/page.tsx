"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import EventForm from "./_components/event-form"
import { Menu } from "@/lib/utils"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { EventWithRelations } from "@/types/event"
import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

async function getEvent(id: string): Promise<EventWithRelations> {
  const response = await fetch(`/api/event/${id}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar evento');
  }
  return response.json();
}

export default function EventPage() {
  const params = useParams();
  const [menu, setMenu] = useState<Menu | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', params.id],
    queryFn: () => getEvent(params.id as string),
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex flex-col gap-4 mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
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
            <BreadcrumbItem>
              <BreadcrumbLink href="/events">
                Eventos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{event?.title || 'Editar Evento'}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">{event?.title || 'Editar Evento'}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <EventForm onUpload={(menu: Menu) => setMenu(menu)} event={event} />
        </div>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          {(menu || event?.menu) && (
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>{(menu || event?.menu)?.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(menu || event?.menu)?.sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-base font-medium text-muted-foreground">{section.title}</h3>
                    <div className="grid gap-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-center py-1">
                          <div>
                            <span className="text-sm font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Com Álcool:</span>
                    <span className="text-sm font-medium">
                      R$ {(menu || event?.menu)?.priceWithAlcohol.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium">Sem Álcool:</span>
                    <span className="text-sm font-medium">
                      R$ {(menu || event?.menu)?.priceWithoutAlcohol.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
