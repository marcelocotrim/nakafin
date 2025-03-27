import Elysia from "elysia"
import { prisma } from "@/lib/prisma"

const app = new Elysia({ prefix: '/event' }).get('/', async () => {
  return prisma.event.findMany({
    include: {
      location: {
        include: {
          parent: true,
        },
      },
      responsiblePerson: true,
    },
  })
})

export default app
