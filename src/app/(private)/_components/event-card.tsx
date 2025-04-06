import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EventWithRelations } from '@/types/event';

interface EventCardProps {
  event: EventWithRelations;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col p-3 border rounded-lg hover:bg-muted/50 cursor-pointer gap-3",
        format(new Date(event.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "border-[rgb(34_197_94)]"
      )}
      onClick={onClick}
    >
      <div className="space-y-2 mb-2">
        <div>
          <h3 className="font-medium text-base">{event.title || 'Sem título'}</h3>
          <p className="text-xs text-muted-foreground">
            {format(new Date(event.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ? `Hoje às ${format(new Date(event.date), 'HH:mm')}`
              : format(new Date(event.date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
            <span className="truncate max-w-[200px]">{event.location.parent ? `${event.location.parent.name} - ${event.location.name}` : event.location.name}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building"><path d="M2 20h20" /><path d="M5 20V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12" /><path d="M9 20v-4h6v4" /></svg>
            <span className="truncate max-w-[150px]">{event.contractor.companyName}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span className="truncate max-w-[150px]">{event.contractor.name}</span>
          </div>
          <span>•</span>
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
      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          {event.participantsQuantity} participante(s)
        </p>
        <p className="font-medium text-base">
          R$ {event.totalWithServiceFee?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
} 