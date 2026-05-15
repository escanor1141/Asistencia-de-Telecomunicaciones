const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.count();
  const courses = await prisma.course.count();
  const attendances = await prisma.attendance.count();
  console.log({ students, courses, attendances });
}

main().finally(() => prisma.$disconnect());
