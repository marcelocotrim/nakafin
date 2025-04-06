import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import createPerson from '@/api/create-person';
import listEvents from '@/api/list-events';
import listLocations from '@/api/list-locations';
import listPersons from '@/api/list-persons';
import getEvent from '@/api/get-event';
import updateEvent from '@/api/update-event';
import betterAuth from '@/api/middleware';
import updateEventStatus from '@/api/update-event-status';
const app = new Elysia({ prefix: '/api' })
.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
  .use(betterAuth)
  .use(createPerson)
  .use(listEvents)
  .use(listLocations)
  .use(listPersons)
  .use(getEvent)
  .use(updateEvent)
  .use(updateEventStatus)

export type App = typeof app;

app.onError(({ error, code, headers, path, params, query, body }) => {
  console.error(error, code, headers, path, params, query, body);
  return { error: 'Internal Server Error' };
});

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;