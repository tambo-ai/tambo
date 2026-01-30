import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => new PrismaClient()
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma