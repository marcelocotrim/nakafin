import { Event as PrismaEvent, Person, Location } from '@prisma/client';
import { Menu } from '@/lib/utils';

export type EventWithRelations = Omit<PrismaEvent, 'menu'> & {
  responsiblePerson: Person;
  location: Location & {
    parent?: Location | null;
  };
  menu: Menu;
}; 