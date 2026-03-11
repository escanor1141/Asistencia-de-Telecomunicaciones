import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'profesor@telecom.edu';
    const password = 'Telecom2024';
    const name = 'Profesor Admin';

    const existing = await prisma.teacher.findUnique({ where: { email } });
    if (existing) {
        console.log(`✓ El profesor '${email}' ya existe, no se creó duplicado.`);
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const teacher = await prisma.teacher.create({
        data: { email, passwordHash, name, role: 'ADMIN' }
    });

    console.log(`✅ Profesor creado exitosamente:`);
    console.log(`   Nombre: ${teacher.name}`);
    console.log(`   Email:  ${teacher.email}`);
    console.log(`   Contraseña: ${password}`);
}

main()
    .catch(e => { console.error('Error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
