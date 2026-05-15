const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({ include: { students: true } });
  console.log("Course:", course.name, course.groupCode, course.code);
  console.log("Students in course:", course.students.length);
  
  const allCourses = await prisma.course.findMany({ include: { students: true } });
  for (const c of allCourses) {
    if (c.students.length > 0) {
      console.log(`Course ${c.name} has ${c.students.length} students`);
    }
  }
}

main().finally(() => prisma.$disconnect());
