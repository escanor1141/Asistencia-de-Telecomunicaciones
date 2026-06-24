import prisma from '../src/lib/prisma.js';

(async () => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'EXPORTAR_REPORTE' },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    let updated = 0;
    for (const log of logs) {
      const detalles = log.details || {};
      if (detalles.courseName) continue;
      const courseId = detalles.courseId;
      if (!courseId) continue;

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) continue;

      detalles.courseName = course.name;

      await prisma.auditLog.update({
        where: { id: log.id },
        data: { details: detalles }
      });
      updated++;
      console.log(`Updated log ${log.id} with courseName '${course.name}'`);
    }

    console.log(`Done. Updated ${updated} logs.`);
    process.exit(0);
  } catch (e) {
    console.error('Error updating audit logs:', e);
    process.exit(1);
  }
})();
