import Elysia, { t } from "elysia"
import { prisma } from "@/lib/prisma"
import { EventStatus } from "@prisma/client";

const validateEvent = t.Object({
  title: t.Optional(t.String()),
  description: t.Optional(t.String()),
  price: t.Number(),
  date: t.Date(),
  locationId: t.Optional(t.String()),
  operationId: t.String(),
  participantsQuantity: t.Optional(t.Number()),
  contractorId: t.String(),
  menu: t.Optional(t.Object({
    title: t.String(),
    sections: t.Array(t.Object({
      title: t.String(),
      items: t.Array(t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
      })),
    })),
    priceWithAlcohol: t.Number(),
    priceWithoutAlcohol: t.Number(),
  })),
  status: t.Union([t.Literal('DRAFT'), t.Literal('PUBLISHED'), t.Literal('CANCELLED'), t.Literal('CONFIRMED')]),
  userId: t.String(),
});


const updateEvent = async ({ params, body }: { params?: { id: string }, body: {
  title?: string;
  description?: string;
  price?: number;
  date: Date;
  locationId?: string;
  operationId: string;
  participantsQuantity?: number;
  contractorId: string;
  menu?: {
    title: string;
    sections: {
      title: string;
      items: { name: string; description?: string; }[];
    }[];
    priceWithAlcohol: number;
    priceWithoutAlcohol: number;
  };
  status: string;
  userId: string;
} }) => {
  const discount = 0.2
  try {
    
    // Set default price if undefined
    const price = body.price || 0;
    const participantsQuantity = body.participantsQuantity || 0;
    // Use upsert instead of update to handle both create and update cases
    const event = await prisma.event.upsert({
      where: {
        id: params?.id,
      },
      update: {
        title: body.title,
        description: body.description,
        price: Number(price.toFixed(2)),
        priceWithServiceFee: Number((price * 1.135).toFixed(2)),
        serviceFee: 0.135,
        total: Number((price * participantsQuantity).toFixed(2)),
        totalWithServiceFee: Number((price * participantsQuantity * 1.135).toFixed(2)),
        totalWithServiceFeeAndDiscount: Number((price * participantsQuantity * 1.135 * (1 - discount)).toFixed(2)),
        discount,
        date: body.date,
        locationId: body.locationId ?? body.operationId,
        participantsQuantity: participantsQuantity,
        contractorId: body.contractorId,
        menu: body.menu,
        status: body.status as EventStatus,
        userId: body.userId,
      },
      create: {
        title: body.title || '',
        description: body.description || '',
        price: Number(price.toFixed(2)),
        priceWithServiceFee: Number((price * 1.135).toFixed(2)),
        serviceFee: 0.135,
        total: Number((price * participantsQuantity).toFixed(2)),
        totalWithServiceFee: Number((price * participantsQuantity * 1.135).toFixed(2)),
        totalWithServiceFeeAndDiscount: Number((price * participantsQuantity * 1.135 * (1 - discount)).toFixed(2)),
        discount,
        date: body.date,
        locationId: body.locationId ?? body.operationId,
        participantsQuantity: body.participantsQuantity,
        contractorId: body.contractorId,
        menu: body.menu,
        status: body.status as EventStatus,
        userId: body.userId,
      },
    })
    return event
  } catch (error) {
    console.error(error)
    
    // Check if it's a Prisma error for record not found
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return { error: 'Event not found', status: 404 }
    }
    
    return { error: 'Failed to update event', status: 500 }
  }
}

const app = new Elysia({ prefix: '/event' })
.post('/', async ({ body }) => updateEvent({ body }), {
  body: validateEvent
})
.put('/:id', async ({ params, body }) => updateEvent({ params, body }), {
  body: validateEvent
})

export default app 