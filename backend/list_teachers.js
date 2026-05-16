import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const teachers = await prisma.teacher.findMany();
    console.log(JSON.stringify(teachers, null, 2));
}
main().finally(() => prisma.$disconnect());
