import { PrismaClient } from '../../../prisma/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { databaseConfig } from '../../config/index.js'

// Singleton Prisma client
let prismaInstance: PrismaClient | null = null

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const pool = new PrismaPg({ connectionString: databaseConfig.postgres.url })
    prismaInstance = new PrismaClient({ adapter: pool })
  }
  return prismaInstance
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
}
