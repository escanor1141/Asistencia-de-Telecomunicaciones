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

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        // Filtro de fechas
        const filtroFecha = {}
        if (fechaInicio) filtroFecha.gte = fechaInicio
        if (fechaFin)    filtroFecha.lte = fechaFin

        // Condición WHERE base
        const condicion = { courseId: idCurso }
        if (Object.keys(filtroFecha).length > 0) {
            condicion.date = filtroFecha
        }

        // Filtros opcionales sobre la relación Course
        const filtroCurso = {}
        if (codigo)    filtroCurso.code      = codigo
        if (grupo)     filtroCurso.groupCode = grupo
        if (docenteId) filtroCurso.teacherId = docenteId

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
                    id: idEst,
                    name: reg.student.name,
                    total: 0,
                    present: 0
                }
            }
            estadisticasPorEstudiante[idEst].total += 1
            if (reg.present) {
                estadisticasPorEstudiante[idEst].present += 1
            }
        })

        const resultado = Object.values(estadisticasPorEstudiante).map(est => ({
            ...est,
            percentage: est.total > 0 ? Math.round((est.present / est.total) * 100) : 0
        })).sort((a, b) => b.percentage - a.percentage)

        return Response.json(resultado)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al generar reporte' }, { status: 500 })
    }
}
