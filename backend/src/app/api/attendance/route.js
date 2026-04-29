import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ── Helper: construye la condición WHERE para los filtros opcionales ──────────
function construirFiltro({ idCurso, codigo, grupo, docenteId, anio, periodo, modalidad }) {
    const where = {}

    if (idCurso) where.courseId = idCurso

    // Filtros sobre la relación Course (JOIN implícito de Prisma)
    const filtroCurso = {}
    if (codigo)    filtroCurso.code          = codigo
    if (grupo)     filtroCurso.groupCode     = grupo
    if (docenteId) filtroCurso.teacherId     = docenteId
    if (anio)      filtroCurso.academicYear  = anio
    if (periodo)   filtroCurso.academicPeriod = periodo
    if (modalidad) filtroCurso.name = { contains: modalidad, mode: 'insensitive' }

    if (Object.keys(filtroCurso).length > 0) {
        where.course = filtroCurso
    }

    return where
}

// GET — listar u obtener asistencia según parámetros
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const fecha     = searchParams.get('date')
        const idCurso   = searchParams.get('courseId')
        const codigo    = searchParams.get('codigo')    || null
        const grupo     = searchParams.get('grupo')     || null
        const docenteId = searchParams.get('docenteId') || null
        const anio      = searchParams.get('anio')      || null
        const periodo   = searchParams.get('periodo')   || null
        const modalidad = searchParams.get('modalidad') || null

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        const whereFiltros = construirFiltro({ idCurso, codigo, grupo, docenteId, anio, periodo, modalidad })


        if (!fecha) {
            // Sin fecha: devuelve historial agrupado por día
            // Los filtros de código/grupo/docente aplican a qué cursos se incluyen.
            // Si hay filtros adicionales (código/grupo/docente), primero obtenemos
            // los courseIds válidos y usamos el historial raw agrupado por fecha.
            let courseIds = [idCurso]

            if (codigo || grupo || docenteId) {
                const cursosFiltrados = await prisma.course.findMany({
                    where: {
                        ...(codigo    && { code:      codigo }),
                        ...(grupo     && { groupCode: grupo }),
                        ...(docenteId && { teacherId: docenteId }),
                        // Asegurar que pertenecen al mismo teacher del curso activo
                        id: idCurso,
                    },
                    select: { id: true },
                })
                courseIds = cursosFiltrados.map(c => c.id)
                if (courseIds.length === 0) {
                    return Response.json([])
                }
            }

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
            const historial = historialBruto.map(fila => ({
                date: fila.date,
                total: Number(fila.total),
                presentCount: Number(fila.presentCount || 0)
            }))

            return Response.json(historial)
        }

        // Con fecha: registros individuales incluyendo datos del estudiante
        const asistencias = await prisma.attendance.findMany({
            where: { ...whereFiltros, date: fecha },
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
