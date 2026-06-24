import { NextResponse } from 'next/server'
import { createWeeklyReportForTeacher } from '@/lib/attendanceService'
import { obtenerUsuarioDePeticion } from '@/lib/auth'

export async function GET(request) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const teacherId = searchParams.get('teacherId')
        
        if (!teacherId) {
            return Response.json({ error: 'Falta teacherId' }, { status: 400 })
        }

        if (usuario.role !== 'ADMIN' && usuario.id !== teacherId) {
            return Response.json({ error: 'No podés descargar el reporte de otro docente' }, { status: 403 })
        }

        const reporte = await createWeeklyReportForTeacher({ teacherId })
        if (!reporte) {
            return Response.json({ error: 'No se encontró reporte para este docente' }, { status: 404 })
        }

        try {
            const { registrarAccion } = await import('@/lib/auditService')
            await registrarAccion({
                usuario,
                accion: 'EXPORTAR_REPORTE',
                target: 'REPORT',
                detalles: {
                    teacherId,
                    teacherName: reporte.teacherName,
                    courseCount: reporte.courseCount,
                    weekStart: reporte.weekStart,
                    weekEnd: reporte.weekEnd,
                    totalRecords: reporte.totalRecords,
                },
                ip: request.headers.get('x-forwarded-for') || '127.0.0.1'
            })
        } catch (err) {
            console.warn('[Audit] No se pudo registrar log de descarga:', err)
        }

        const filename = `reporte-${reporte.teacherName.replace(/\s+/g, '-').toLowerCase()}-${reporte.weekStart}.xlsx`
        return new Response(reporte.buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error('Error descargando reporte:', error)
        return Response.json({ error: 'Error al descargar reporte' }, { status: 500 })
    }
}
