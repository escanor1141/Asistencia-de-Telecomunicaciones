import { PrismaClient } from '@prisma/client'

// Robust configuration for Windows, ensuring 127.0.0.1 is used
const dbUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1')

const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: { url: dbUrl }
        },
        errorFormat: 'pretty',
        log: [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'info', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' }
        ],
    })
}

const globalForPrisma = globalThis
const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaGlobal = prisma

export default prisma
