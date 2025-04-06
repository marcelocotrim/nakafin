import { prisma } from "@/lib/prisma"
import Elysia, { t } from "elysia"

const app = new Elysia({ prefix: '/event' })
.put('/:id/status', async ({ params, body }) => {
  const { id } = params
  const { status } = body

  const event = await prisma.event.update({
    where: { id },
    data: { status }
  })

  return event
}, {
  body: t.Object({
    status: t.Union([t.Literal('DRAFT'), t.Literal('PUBLISHED'), t.Literal('CANCELLED'), t.Literal('CONFIRMED')])
  })
})

export default app 
