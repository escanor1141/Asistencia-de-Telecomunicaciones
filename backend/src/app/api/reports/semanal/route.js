import prisma from '@/lib/prisma'

// Devuelve la fecha del lunes de la semana que contiene la fecha dada
// Trabaja con las partes de la fecha como string para evitar desfases de UTC
function lunesDeSemana(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day); // fecha local sin desfase UTC
    const dow  = d.getDay();                  // 0=Dom…6=Sáb
    const diff = dow === 0 ? -6 : 1 - dow;   // días al lunes
    d.setDate(d.getDate() + diff);
    // Formatear como YYYY-MM-DD sin pasar por UTC
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dy}`;
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

        const agrupacion  = sp.get('agrupacion') || 'semana' // 'semana' o 'dia'

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
        if (modalidad) fc.programa       = { contains: modalidad, mode: 'insensitive' }

        if (Object.keys(fc).length > 0) where.course = fc

        // ── Consulta ─────────────────────────────────────────────────────────
        const registros = await prisma.attendance.findMany({
            where,
            select: { date: true, present: true, status: true },
            orderBy: { date: 'asc' },
        })

        // ── Agrupar por tiempo ───────────────────────────────────────────────
        const porTiempo = {}
        registros.forEach(({ date, present, status }) => {
            const clave = agrupacion === 'semana' ? lunesDeSemana(date) : date
            if (!porTiempo[clave]) {
                porTiempo[clave] = { presente: 0, ausente: 0, justificado: 0 }
            }
            const estado = status || (present ? 'Presente' : 'Ausente');
            if (estado === 'Presente')    porTiempo[clave].presente++
            else if (estado === 'Justificado') porTiempo[clave].justificado++
            else                          porTiempo[clave].ausente++
        })

        const semanas = Object.keys(porTiempo)
            .sort()
            .map((clave, idx) => ({
                semana:      agrupacion === 'semana' ? `Semana ${idx + 1}` : clave,
                fechaLunes:  clave, // en modo dia esto es simplemente la fecha
                ...porTiempo[clave],
            }))

        return Response.json({ semanas })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al generar reporte semanal' }, { status: 500 })
    }
}
