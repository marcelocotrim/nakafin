import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-200 z-50 bg-stone-100">
      <div className="px-4 h-full flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          NakaFin
        </Link>
        <Button asChild>
          <Link href="/evento">
            Criar Evento
          </Link>
        </Button>
      </div>
    </header>
  );
} 