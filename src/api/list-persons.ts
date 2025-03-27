import Elysia from "elysia";
import { prisma } from "@/lib/prisma"

const app = new Elysia({ prefix: '/person' }).get('/', async ({ query }) => {
  const searchText = query.search as string | undefined;
  console.log(searchText)
  const persons = await prisma.person.findMany({
    where: searchText ? {
      OR: [
        { name: { contains: searchText, mode: 'insensitive' } },
        { phoneNumber: { contains: searchText } },
        { companyName: { contains: searchText, mode: 'insensitive' } }
      ]
    } : undefined
  })

  return persons
})

export default app