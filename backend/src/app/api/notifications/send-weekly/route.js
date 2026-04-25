import { NextResponse } from 'next/server';
import { obtenerUsuarioDePeticion } from '@/lib/auth';
import { runWeeklyNotification } from '@/jobs/weeklyAbsenceNotification';

/**
 * POST /api/notifications/send-weekly
 * Ejecuta manualmente el proceso de notificación semanal.
 * Solo accesible por usuarios con rol ADMIN.
 */
export async function POST(request) {
    // Verificar autenticación y rol ADMIN
    const usuario = obtenerUsuarioDePeticion(request);
    if (!usuario) {
        return Response.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (usuario.role !== 'ADMIN') {
        return Response.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
    }

    console.log(`[send-weekly] Ejecución manual por: ${usuario.email} a las ${new Date().toISOString()}`);

    try {
        const resultados = await runWeeklyNotification();
        return Response.json({
            success: true,
            message: 'Proceso de notificación completado',
            results: {
                sent: resultados.sent,
                skipped: resultados.skipped,
                errors: resultados.errors,
                details: resultados.details,
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
    const usuario = obtenerUsuarioDePeticion(request);
    if (!usuario) {
        return Response.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (usuario.role !== 'ADMIN') {
        return Response.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
    }

    return Response.json({
        servicio: 'notificador-semanal-inasistencias',
        estado: 'activo',
        programacion: '0 18 * * 0 (Domingos a las 18:00)',
        descripcion: 'Envía correos a estudiantes con inasistencias de la semana (lunes-sábado)',
    });
}
