import Elysia from "elysia";
import { prisma } from "@/lib/prisma"

const app = new Elysia({ prefix: '/location' }).get('/', async () => {
  return prisma.location.findMany({
    where: {
      parentId: null,
    },
    include: {
      children: true,
    },
    orderBy: {
      name: 'asc',
    },
  })
})

export default app