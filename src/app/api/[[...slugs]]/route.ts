import { Elysia } from 'elysia';
import createEvent from '@/api/create-event';
import createPerson from '@/api/create-person';
import listEvents from '@/api/list-events';
import listLocations from '@/api/list-locations';
import listPersons from '@/api/list-persons';

const app = new Elysia({ prefix: '/api' })
  .use(createEvent)
  .use(createPerson)
  .use(listEvents)
  .use(listLocations)
  .use(listPersons)

export type App = typeof app;

app.onError(({ error, code, headers, path, params, query, body }) => {
  console.error(error, code, headers, path, params, query, body);
  return { error: 'Internal Server Error' };
});

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;