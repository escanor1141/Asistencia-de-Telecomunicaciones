import prisma from '../src/lib/prisma.js';

(async () => {
  try {
    const logs = await prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error reading audit logs:', e);
    process.exit(1);
  }
})();
