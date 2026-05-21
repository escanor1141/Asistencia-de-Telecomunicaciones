/**
 * server.js — Servidor personalizado con Node.js para Next.js + node-cron
 *
 * Uso:
 *   node server.js        (producción)
 *   next dev -p 4000      (desarrollo, sin cron)
 *
 * El cron ejecuta el job de notificaciones cada domingo a las 18:00.
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import cron from 'node-cron';

// Importar el job de notificaciones
// Usamos dynamic import para compatibilidad con el módulo ESM de Next.js
let runWeeklyNotification;

const dev = process.env.NODE_ENV !== 'production';
const PORT = parseInt(process.env.PORT || '4000', 10);

const app = next({ dev, dir: '.' });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
    // Importar el job después de que Next.js esté listo
    const jobModule = await import('./src/jobs/weeklyAbsenceNotification.js');
    runWeeklyNotification = jobModule.runWeeklyNotification;

    // ─── Configurar node-cron ────────────────────────────────────────────
    // TEST: dispara a las 18:30 de hoy (miércoles) — luego volver a '0 9 * * 0'
    cron.schedule('58 18 * * 3', async () => {
        console.log('\n[cron] ⏰ Tarea de prueba ejecutada - Miércoles 18:58');
        try {
            await runWeeklyNotification();
        } catch (err) {
            console.error('[cron] Error en tarea programada:', err.message);
        }
    }, {
        scheduled: true,
        timezone: 'America/Bogota', // Zona horaria Colombia (UTC-5)
    });

    console.log('[server] ✅ Cron configurado: Domingos a las 09:00 AM (America/Bogota)');
    // ─────────────────────────────────────────────────────────────────────

    // Crear servidor HTTP
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(PORT, (err) => {
        if (err) {
            console.error('[server] Error al iniciar:', err);
            process.exit(1);
        }
        console.log(`[server] ✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`[server] Modo: ${dev ? 'desarrollo' : 'producción'}`);
    });
});
