import Elysia from "elysia"
import { prisma } from "@/lib/prisma"
import { EventStatus } from "@prisma/client"
import { startOfDay, endOfDay } from "date-fns"

const app = new Elysia({ prefix: '/event' })
  .get('/', async ({ query }) => {
    const { startDate, endDate, contractorId, status } = query

    const where = {
      ...(status && { status: status as EventStatus }),
      ...(startDate && {
        date: {
          gte: startOfDay(new Date(startDate as string)),
          ...(endDate && { lte: endOfDay(new Date(endDate as string)) }),
        },
      }),
      ...(contractorId && { contractorId: contractorId as string }),
    }

    return prisma.event.findMany({
      where,
      include: {
        location: {
          include: {
            parent: true,
          },
        },
        contractor: true,
        user: true,
      },
      orderBy: {
        date: 'asc',
      },
    })
  })

export default app
