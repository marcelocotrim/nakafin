import Elysia, { t } from "elysia"
import { prisma } from "@/lib/prisma"

const app = new Elysia({ prefix: '/person' }).post('/', async ({ body }) => {
return prisma.person.create({
  data: {
    name: body.name,
    phoneNumber: body.phoneNumber,
    companyName: body.companyName,
  },
})
}, {
    body: t.Object({
      name: t.String(),
      phoneNumber: t.String(),
      companyName: t.String(),
    })
  }
)

export default app
