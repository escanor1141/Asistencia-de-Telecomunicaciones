import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — reporte de asistencia por porcentaje de presencia con filtros opcionales
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const fechaInicio = searchParams.get('startDate')
        const fechaFin    = searchParams.get('endDate')
        const idCurso     = searchParams.get('courseId')
        const codigo      = searchParams.get('codigo')    || null
        const grupo       = searchParams.get('grupo')     || null
        const docenteId   = searchParams.get('docenteId') || null
        const anio        = searchParams.get('anio')      || null
        const periodo     = searchParams.get('periodo')   || null

        if (!idCurso && !docenteId && !anio) {
            return Response.json({ error: 'Se requiere courseId, docenteId o anio' }, { status: 400 })
        }

        // Filtro de fechas — si se pasa anio/periodo, derivar fechas automáticamente
        const filtroFecha = {}
        if (anio && periodo && !fechaInicio && !fechaFin) {
            // Período 1: 01/01 → 30/06 | Período 2: 01/07 → 31/12
            if (periodo === '1') {
                filtroFecha.gte = `${anio}-01-01`
                filtroFecha.lte = `${anio}-06-30`
            } else {
                filtroFecha.gte = `${anio}-07-01`
                filtroFecha.lte = `${anio}-12-31`
            }
        } else {
            if (fechaInicio) filtroFecha.gte = fechaInicio
            if (fechaFin)    filtroFecha.lte = fechaFin
        }

        // Condición WHERE base — courseId es opcional
        const condicion = {}
        if (idCurso) condicion.courseId = idCurso
        if (Object.keys(filtroFecha).length > 0) {
            condicion.date = filtroFecha
        }

        // Filtros opcionales sobre la relación Course
        const filtroCurso = {}
        if (codigo)    filtroCurso.code           = codigo
        if (grupo)     filtroCurso.groupCode       = grupo
        if (docenteId) filtroCurso.teacherId       = docenteId
        if (anio)      filtroCurso.academicYear    = anio
        if (periodo)   filtroCurso.academicPeriod  = periodo

        if (Object.keys(filtroCurso).length > 0) {
            condicion.course = filtroCurso
        }

        const asistencias = await prisma.attendance.findMany({
            where: condicion,
            include: { student: true }
        })

        // Agrupar por estudiante
        const estadisticasPorEstudiante = {}

        asistencias.forEach(reg => {
            const idEst = reg.student.documento
            if (!estadisticasPorEstudiante[idEst]) {
                estadisticasPorEstudiante[idEst] = {
                    id:          idEst,
                    name:        reg.student.name,
                    total:       0,   // todas las clases registradas
                    present:     0,   // Presente
                    absent:      0,   // Ausente (falla)
                    justified:   0,   // Justificado
                }
            }
            const estado = reg.status || (reg.present ? 'Presente' : 'Ausente');
            estadisticasPorEstudiante[idEst].total += 1
            if (estado === 'Presente')    estadisticasPorEstudiante[idEst].present++
            else if (estado === 'Justificado') estadisticasPorEstudiante[idEst].justified++
            else                          estadisticasPorEstudiante[idEst].absent++
        })

        const calcularFaltasPermitidas = (present, absent) => {
            const clasesQueCuentan = present + absent;
            return clasesQueCuentan > 0
                ? Math.max(1, Math.ceil(clasesQueCuentan * 0.2))
                : 0;
        };

        const resultado = Object.values(estadisticasPorEstudiante).map(est => {
            // El porcentaje se calcula sobre las clases que cuentan (no justificadas)
            const clasesQueCountan = est.present + est.absent;
            const percentage = clasesQueCountan > 0
                ? Math.round((est.present / clasesQueCountan) * 100)
                : 100; // si todo es justificado, no hay fallas
            const absencesAllowed = calcularFaltasPermitidas(est.present, est.absent);
            return {
                ...est,
                percentage,
                absencesAllowed,
                failedByAbsence: est.absent >= absencesAllowed,
            };
        }).sort((a, b) => b.percentage - a.percentage)

        return Response.json(resultado)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al generar reporte' }, { status: 500 })
    }
}
