const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.teacher.findMany();
  console.log('--- TEACHERS IN DATABASE ---');
  console.log(JSON.stringify(teachers, null, 2));
  
  const courses = await prisma.course.findMany({
    select: {
        id: true,
        name: true,
        teacherId: true
    }
  });
  console.log('--- COURSES IN DATABASE ---');
  console.log(JSON.stringify(courses, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
