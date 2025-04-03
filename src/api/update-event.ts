import Elysia, { t } from "elysia"
import { prisma } from "@/lib/prisma"

const app = new Elysia({ prefix: '/event' }).put('/:id', async ({ params, body }) => {
  const discount = 0.2
  try {
    // For draft events, we can use default values for required fields
    const isDraft = body.status === 'DRAFT';
    
    // For draft events, we need to ensure we have valid IDs for required fields
    // or create temporary records if needed
    let locationId = body.locationId;
    let contractorId = body.contractorId;
    
    // If this is a draft and we don't have a location, create a temporary one
    if (isDraft && !locationId) {
      const tempLocation = await prisma.location.create({
        data: {
          name: "Local temporário",
        }
      });
      locationId = tempLocation.id;
    }
    
    // If this is a draft and we don't have a contractor, create a temporary one
    if (isDraft && !contractorId) {
      const tempContractor = await prisma.person.create({
        data: {
          name: "Responsável temporário",
          phoneNumber: "00000000000",
          companyName: "Empresa temporária",
        }
      });
      contractorId = tempContractor.id;
    }
    
    const event = await prisma.event.update({
      where: {
        id: params.id,
      },
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
        locationId: locationId!,
        participantsQuantity: body.participantsQuantity,
        contractorId: contractorId!,
        menu: body.menu,
        status: body.status || 'DRAFT',
        userId: body.userId,
      },
    })
    return event
  } catch (error) {
    console.error(error)
    return { error: 'Failed to update event' }
  }
}, {
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      price: t.Number(),
      date: t.Date(),
      locationId: t.Optional(t.String()),
      participantsQuantity: t.Number(),
      contractorId: t.Optional(t.String()),
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
      status: t.Optional(t.Union([t.Literal('DRAFT'), t.Literal('PUBLISHED'), t.Literal('CANCELLED')])),
      userId: t.String(),
    }),
  }
)

export default app 