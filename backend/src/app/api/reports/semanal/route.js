import prisma from '@/lib/prisma'

// Devuelve la fecha del lunes de la semana que contiene la fecha dada
function lunesDeSemana(dateStr) {
    const d = new Date(dateStr + 'T00:00:00Z')
    const dow = d.getUTCDay()                          // 0=Dom…6=Sáb
    const diff = dow === 0 ? -6 : 1 - dow             // días al lunes
    d.setUTCDate(d.getUTCDate() + diff)
    return d.toISOString().split('T')[0]               // "YYYY-MM-DD"
}

// GET — reporte semanal agregado
// Params: courseId?, codigo?, grupo?, docenteId?, anio?, periodo?, modalidad?,
//         startDate?, endDate?
// Requiere al menos: courseId | docenteId | modalidad
export async function GET(request) {
    try {
        const sp          = new URL(request.url).searchParams
        const courseId    = sp.get('courseId')   || null
        const codigo      = sp.get('codigo')     || null
        const grupo       = sp.get('grupo')      || null
        const docenteId   = sp.get('docenteId')  || null
        const anio        = sp.get('anio')        || null
        const periodo     = sp.get('periodo')     || null
        const modalidad   = sp.get('modalidad')  || null
        const startDate   = sp.get('startDate')  || null
        const endDate     = sp.get('endDate')    || null

        if (!courseId && !docenteId && !modalidad) {
            return Response.json(
                { error: 'Se requiere courseId, docenteId o modalidad' },
                { status: 400 }
            )
        }

        // ── WHERE ────────────────────────────────────────────────────────────
        const where = {}
        if (courseId) where.courseId = courseId
        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = startDate
            if (endDate)   where.date.lte = endDate
        }

        const fc = {}
        if (codigo)    fc.code           = codigo
        if (grupo)     fc.groupCode      = grupo
        if (docenteId) fc.teacherId      = docenteId
        if (anio)      fc.academicYear   = anio
        if (periodo)   fc.academicPeriod = periodo
        if (modalidad) fc.name           = { contains: modalidad, mode: 'insensitive' }

        if (Object.keys(fc).length > 0) where.course = fc

        // ── Consulta ─────────────────────────────────────────────────────────
        const registros = await prisma.attendance.findMany({
            where,
            select: { date: true, present: true, status: true },
            orderBy: { date: 'asc' },
        })

        // ── Agrupar por semana ───────────────────────────────────────────────
        const porSemana = {}
        registros.forEach(({ date, present, status }) => {
            const lunes = lunesDeSemana(date)
            if (!porSemana[lunes]) {
                porSemana[lunes] = { presente: 0, ausente: 0, justificado: 0 }
            }
            const estado = status || (present ? 'Presente' : 'Ausente');
            if (estado === 'Presente')    porSemana[lunes].presente++
            else if (estado === 'Justificado') porSemana[lunes].justificado++
            else                          porSemana[lunes].ausente++
        })

        const semanas = Object.keys(porSemana)
            .sort()
            .map((lunes, idx) => ({
                semana:      `Semana ${idx + 1}`,
                fechaLunes:  lunes,
                ...porSemana[lunes],
            }))

        return Response.json({ semanas })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al generar reporte semanal' }, { status: 500 })
    }
}
