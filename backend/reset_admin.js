import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const passwordHash = await bcrypt.hash('Admin2024!', 10);
    await prisma.teacher.update({
        where: { email: 'admin@uts.edu.co' },
        data: { passwordHash, role: 'ADMIN' }
    });
    console.log('Admin password updated to Admin2024!');
}
main().finally(() => prisma.$disconnect());
