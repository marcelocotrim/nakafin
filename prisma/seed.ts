import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
// import { Argon2id } from 'oslo/password'

const prisma = new PrismaClient()

async function main() {
  // Upsert admin user
  const userId = crypto.randomUUID().replace(/-/g, '');
  const hashedPassword = createHash('sha256').update('admin123').digest('hex');

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      accounts: {
        updateMany: {
          where: { providerId: 'credential' },
          data: {
            password: hashedPassword,
          },
        },
      },
    },
    create: {
      id: userId,
      email: 'admin@example.com',
      name: 'Admin User',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'admin',
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: 'credential',
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  // Helper function to upsert location
  async function upsertLocation(name: string, parentId: string | null = null) {
    const existingLocation = await prisma.location.findFirst({
      where: { name }
    });

    if (existingLocation) {
      return existingLocation;
    }

    return prisma.location.create({
      data: {
        name,
        parentId,
      },
    });
  }

  // Create main locations and their sub-locations
  const ruda = await upsertLocation('Rudä');
  await Promise.all([
    upsertLocation('Segundo Piso', ruda.id),
    upsertLocation('Gazebo', ruda.id),
    upsertLocation('Jardim de Inverno', ruda.id),
  ]);

  const izar = await upsertLocation('Izär');
  await Promise.all([
    upsertLocation('Salão', izar.id),
    upsertLocation('Céu de Estrelas', izar.id),
  ]);

  const maska = await upsertLocation('Mäska');
  await Promise.all([
    upsertLocation('Salão', maska.id),
    upsertLocation('Boato', maska.id),
  ]);

  // Create standalone locations
  await upsertLocation('Braserie Mimolette');
  await upsertLocation('It');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
