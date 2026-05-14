import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — endpoint dedicado para generar la data del Excel de reportes con filtros
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

        // Condición WHERE base
        const condicion = {}
        if (idCurso) condicion.courseId = idCurso
        if (Object.keys(filtroFecha).length > 0) {
            condicion.date = filtroFecha
        }

        // Filtros opcionales sobre la relación Course
        const filtroCurso = {}
        if (codigo)    filtroCurso.code           = codigo
        if (grupo)     filtroCurso.groupCode      = grupo
        if (docenteId) filtroCurso.teacherId      = docenteId
        if (anio)      filtroCurso.academicYear   = anio
        if (periodo)   filtroCurso.academicPeriod = periodo

        if (Object.keys(filtroCurso).length > 0) {
            condicion.course = filtroCurso
        }

        const asistencias = await prisma.attendance.findMany({
            where: condicion,
            include: { 
                student: true,
                course: true
            }
        })

        // Estructuras de datos para las hojas del Excel
        const statsGeneral = {} 
        const statsAsignatura = {}
        const contactoEstudiantes = {}

        asistencias.forEach(reg => {
            const idEst = reg.student.documento
            const idCurso = reg.courseId
            const estado = reg.status || (reg.present ? 'Presente' : 'Ausente')

            // 1. Resumen General
            if (!statsGeneral[idEst]) {
                statsGeneral[idEst] = {
                    documento: idEst,
                    name: reg.student.name,
                    total: 0, present: 0, absent: 0, justified: 0
                }
            }
            statsGeneral[idEst].total++
            if (estado === 'Presente') statsGeneral[idEst].present++
            else if (estado === 'Justificado') statsGeneral[idEst].justified++
            else statsGeneral[idEst].absent++

            // 2. Por Asignatura
            const keyAsignatura = `${idEst}-${idCurso}`
            if (!statsAsignatura[keyAsignatura]) {
                statsAsignatura[keyAsignatura] = {
                    documento: idEst,
                    estudiante: reg.student.name,
                    asignatura: reg.course.name,
                    codigo: reg.course.code,
                    grupo: reg.course.groupCode,
                    total: 0, present: 0, absent: 0, justified: 0
                }
            }
            statsAsignatura[keyAsignatura].total++
            if (estado === 'Presente') statsAsignatura[keyAsignatura].present++
            else if (estado === 'Justificado') statsAsignatura[keyAsignatura].justified++
            else statsAsignatura[keyAsignatura].absent++

            // 3. Directorio de Contacto (incluir si alguna vez falló, no importando si es justificado o no, para asegurar tener su dato en la BD si entra en riesgo)
            // Se filtrará al final solo los que tengan porcentaje de la asignatura <= 80
            contactoEstudiantes[idEst] = {
                documento: idEst,
                name: reg.student.name,
                email: reg.student.email || 'No registrado',
                correo2: reg.student.correo2 || 'No registrado',
                whatsapp: reg.student.whatsapp || 'No registrado',
                telefono2: reg.student.telefono2 || 'No registrado'
            }
        })

        const calcPorcentaje = (est) => {
            const clasesQueCuentan = est.present + est.absent
            return clasesQueCuentan > 0 ? Math.round((est.present / clasesQueCuentan) * 100) : 100
        }

        const resumen = Object.values(statsGeneral).map(est => ({
            ...est,
            percentage: calcPorcentaje(est)
        })).sort((a, b) => b.percentage - a.percentage) // de menor a mayor asistencia

        // Filtrar <= 80% (Estudiantes que reprueban por inasistencia)
        const enRiesgo = resumen.filter(est => est.percentage <= 80)

        // Asignaturas
        const asignaturas = Object.values(statsAsignatura).map(est => ({
            ...est,
            percentage: calcPorcentaje(est)
        })).sort((a, b) => a.estudiante.localeCompare(b.estudiante))

        // El directorio solo debe incluir a estudiantes que aparecen en "enRiesgo" o tienen alguna materia perdida (<80)
        // Pero para ser más exactos, el usuario pidió "la informacion de contacto del estudiante que presenta fallas"
        // Si presenta al menos 1 falla (ausencia), lo metemos.
        const estudiantesConFallas = new Set(
            Object.values(statsAsignatura).filter(est => est.absent > 0).map(e => e.documento)
        )

        const directorio = Object.values(contactoEstudiantes)
            .filter(est => estudiantesConFallas.has(est.documento))
            .sort((a, b) => a.name.localeCompare(b.name))

        return Response.json({
            resumen,
            enRiesgo,
            asignaturas,
            directorio
        })

    } catch (error) {
        console.error('Error al generar data para exportar:', error)
        return Response.json({ error: 'Error al generar data del Excel' }, { status: 500 })
    }
}
