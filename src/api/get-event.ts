import Elysia from "elysia"
import { prisma } from "@/lib/prisma"

const app = new Elysia({ prefix: '/event' }).get('/:id', async ({ params }) => {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: params.id,
      },
      include: {
        location: {
          include: {
            parent: true,
          },
        },
        contractor: true,
        user: true,
      },
    })

    if (!event) {
      return { error: 'Event not found' }
    }

    return event
  } catch (error) {
    console.error(error)
    return { error: 'Failed to fetch event' }
  }
})

export default app 