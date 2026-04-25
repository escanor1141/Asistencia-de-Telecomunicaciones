import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — listar u obtener asistencia según parámetros
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const fecha = searchParams.get('date')
        const idCurso = searchParams.get('courseId')

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        if (!fecha) {
            // Sin fecha: devuelve historial agrupado por día (conteos)
            const historialBruto = await prisma.$queryRaw`
        SELECT 
          date, 
          COUNT(id) as "total", 
          SUM(CASE WHEN present THEN 1 ELSE 0 END) as "presentCount" 
        FROM "Attendance" 
        WHERE "courseId" = ${idCurso}
        GROUP BY date 
        ORDER BY date DESC
      `
            // Convertir BigInt a Number si es necesario
            const historial = historialBruto.map(fila => ({
                date: fila.date,
                total: Number(fila.total),
                presentCount: Number(fila.presentCount || 0)
            }))

            return Response.json(historial)
        }

        const asistencias = await prisma.attendance.findMany({
            where: { date: fecha, courseId: idCurso },
            include: { student: true }
        })
        return Response.json(asistencias)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al obtener asistencia' }, { status: 500 })
    }
}

// POST — guardar asistencia de una clase
export async function POST(request) {
    try {
        const { date, courseId, records } = await request.json()
        // records: Array<{ studentId: string, present: boolean }>
        if (!date || !courseId || !Array.isArray(records)) {
            return Response.json({ error: 'Datos inválidos en la petición' }, { status: 400 })
        }

        // Guardar múltiples registros en una sola transacción con upsert
        const operaciones = records.map(registro => {
            return prisma.attendance.upsert({
                where: {
                    studentId_courseId_date: {
                        studentId: registro.studentId,
                        courseId,
                        date
                    }
                },
                update: { present: registro.present },
                create: {
                    studentId: registro.studentId,
                    courseId,
                    date,
                    present: registro.present
                }
            })
        })

        await prisma.$transaction(operaciones)

        // Disparar notificaciones WhatsApp en fire-and-forget
        // No bloquea la respuesta HTTP — el profesor no espera los envíos
        const ausentes = records.filter(r => !r.present);
        if (ausentes.length > 0) {
            const { runAbsenceWhatsAppNotification } = await import('@/jobs/absenceWhatsAppNotification');
            setImmediate(() =>
                runAbsenceWhatsAppNotification(ausentes, courseId, date)
                    .catch(err => console.error('[attendance-route] Error en job WhatsApp:', err))
            );
        }

        return Response.json({ success: true, count: operaciones.length })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al guardar asistencia' }, { status: 500 })
    }
}
