import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create Ruda as the main location
  const ruda = await prisma.location.create({
    data: {
      name: 'Rudä',
      parentId: null,
    },
  })

  // Create sub-locations for Ruda
  await prisma.location.createMany({
    data: [
      {
        name: 'Segundo Piso',
        parentId: ruda.id,
      },
      {
        name: 'Gazebo',
        parentId: ruda.id,
      },
      {
        name: 'Jardim de Inverno',
        parentId: ruda.id,
      },
    ],
  })

  // Create Izar as the main location
  const izar = await prisma.location.create({
    data: {
      name: 'Izär',
      parentId: null,
    },
  })

  // Create sub-locations for Izar
  await prisma.location.createMany({
    data: [
      {
        name: 'Salão',
        parentId: izar.id,
      },
      {
        name: 'Céu de Estrelas',
        parentId: izar.id,
      },
    ],
  })

  // Create Maska as the main location
  const maska = await prisma.location.create({
    data: {
      name: 'Mäska',
      parentId: null,
    },
  })

  // Create sub-locations for Maska
  await prisma.location.createMany({
    data: [
      {
        name: 'Salão',
        parentId: maska.id,
      },
      {
        name: 'Boato',
        parentId: maska.id,
      },
    ],
  })

  // Create Braserie Mimolette as a single location
  await prisma.location.create({
    data: {
      name: 'Braserie Mimolette',
      parentId: null,
    },
  })

  // Create It as a single location
  await prisma.location.create({
    data: {
      name: 'It',
      parentId: null,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
