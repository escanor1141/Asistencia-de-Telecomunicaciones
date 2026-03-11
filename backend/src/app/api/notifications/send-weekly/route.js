import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { runWeeklyNotification } from '@/jobs/weeklyAbsenceNotification';

/**
 * POST /api/notifications/send-weekly
 * Ejecuta manualmente el proceso de notificación semanal.
 * Solo accesible por usuarios con rol ADMIN.
 */
export async function POST(request) {
    // Verificar autenticación y rol ADMIN
    const user = getUserFromRequest(request);
    if (!user) {
        return Response.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
        return Response.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
    }

    console.log(`[send-weekly] Ejecución manual por: ${user.email} a las ${new Date().toISOString()}`);

    try {
        const results = await runWeeklyNotification();
        return Response.json({
            success: true,
            message: 'Proceso de notificación completado',
            results: {
                sent: results.sent,
                skipped: results.skipped,
                errors: results.errors,
                details: results.details,
            },
        });
    } catch (error) {
        console.error('[send-weekly] Error:', error.message);
        return Response.json(
            { error: 'Error al ejecutar el proceso de notificación', detail: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications/send-weekly
 * Devuelve el estado del servicio de notificaciones.
 */
export async function GET(request) {
    const user = getUserFromRequest(request);
    if (!user) {
        return Response.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (user.role !== 'ADMIN') {
        return Response.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
    }

    return Response.json({
        service: 'weekly-absence-notifier',
        status: 'active',
        schedule: '0 18 * * 0 (Domingos a las 18:00)',
        description: 'Envía correos a estudiantes con inasistencias de la semana (lunes-sábado)',
    });
}
