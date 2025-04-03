import { Event as PrismaEvent, Person, Location, User } from '@prisma/client';
import { Menu } from '@/lib/utils';

export type EventWithRelations = Omit<PrismaEvent, 'menu'> & {
  user: User;
  contractor: Person;
  location: Location & {
    parent?: Location | null;
  };
  menu: Menu;
}; 