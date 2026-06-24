import prisma from '../src/lib/prisma.js';

(async () => {
  try {
    // ID tomado de los logs recientes (ajusta si hace falta)
    const id = 'cmqs9cmko0013tbumg1if9qou';
    const existing = await prisma.auditLog.findUnique({ where: { id } });
    if (!existing) {
      console.error('Registro no encontrado', id);
      process.exit(1);
    }

    const detalles = existing.details || {};
    detalles.courseName = detalles.courseName || 'Materia de Prueba';

    await prisma.auditLog.update({ where: { id }, data: { details: detalles } });
    const updated = await prisma.auditLog.findUnique({ where: { id } });
    console.log('Actualizado:', JSON.stringify(updated, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error updating audit log:', e);
    process.exit(1);
  }
})();
