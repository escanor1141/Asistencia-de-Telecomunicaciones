import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const logs = await prisma.whatsappNotificationLog.findMany({
        take: 10,
        orderBy: { sentAt: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));
    await prisma.$disconnect();
}
main();
