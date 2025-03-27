import Elysia, { t } from "elysia"
import { prisma } from "@/lib/prisma"

const app = new Elysia({ prefix: '/event' }).post('/', async ({ body }) => {
  const discount = 0.2
  try {
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        price: Number(body.price.toFixed(2)),
        priceWithServiceFee: Number((body.price * 1.135).toFixed(2)),
        serviceFee: 0.135,
        total: Number((body.price * body.participantsQuantity).toFixed(2)),
        totalWithServiceFee: Number((body.price * body.participantsQuantity * 1.135).toFixed(2)),
        totalWithServiceFeeAndDiscount: Number((body.price * body.participantsQuantity * 1.135 * (1 - discount)).toFixed(2)),
        discount,
        date: body.date,
        locationId: body.locationId,
        participantsQuantity: body.participantsQuantity,
        responsiblePersonId: body.responsiblePersonId,
        menu: body.menu,
      },
    })
    return event
  } catch (error) {
    console.error(error)
    return { error: 'Failed to create event' }
  }
}, {
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      price: t.Number(),
      date: t.Date(),
      locationId: t.String(),
      participantsQuantity: t.Number(),
      responsiblePersonId: t.String(),
      menu: t.Object({
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
      }),
    }),
  }
)

export default app
