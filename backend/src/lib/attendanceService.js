/**
 * attendanceService.js
 * Servicio para consultar las inasistencias semanales de estudiantes.
 */

import prisma from './prisma.js';

// ── Helper: formatea una fecha a "YYYY-MM-DD" en hora de Colombia ────────────
const fmtBogota = (d) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
}).format(d);

/**
 * Calcula el lunes (inicio) y el sábado (fin) de la semana actual
 * usando la fecha local de Colombia para evitar errores de timezone.
 * @param {Date} [referenceDate=new Date()] - Fecha de referencia (default: hoy)
 * @returns {{ weekStart: string, weekEnd: string }} - Fechas en formato YYYY-MM-DD
 */
export function getCurrentWeekRange(referenceDate = new Date()) {
    // Obtener la fecha local de Colombia para calcular el día de la semana correcto
    const localStr = fmtBogota(referenceDate); // "YYYY-MM-DD"
    const [year, month, day] = localStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // fecha local sin desfase UTC

    const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(date);
    monday.setDate(date.getDate() + daysToMonday);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    return {
        weekStart: fmtBogota(monday),
        weekEnd:   fmtBogota(saturday),
    };
}

/**
 * Obtiene las inasistencias de la semana actual agrupadas por estudiante.
 *
 * @param {Object} [options]
 * @param {Date} [options.referenceDate] - Fecha de referencia para calcular la semana
 * @returns {Promise<Array<{
 *   studentId: string,
 *   studentName: string,
 *   email: string|null,
 *   totalAbsences: number,
 *   courses: string[],
 *   weekStart: string,
 *   weekEnd: string
 * }>>}
 */
export async function getWeeklyAbsences({ referenceDate } = {}) {
    const { weekStart, weekEnd } = getCurrentWeekRange(referenceDate);

    console.log(`[attendanceService] Consultando inasistencias del ${weekStart} al ${weekEnd}`);

    // Generar rango de fechas lunes-sábado usando fechas locales
    const dates = [];
    const [sy, sm, sd] = weekStart.split('-').map(Number);
    const [ey, em, ed] = weekEnd.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end   = new Date(ey, em - 1, ed);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(fmtBogota(d));
    }

    // Consultar inasistencias (present = false) en el rango de fechas
    const absences = await prisma.attendance.findMany({
        where: {
            present: false,
            date: { in: dates },
        },
        include: {
            student: {
                select: { documento: true, name: true, email: true },
            },
            course: {
                select: { name: true },
            },
        },
        orderBy: { date: 'asc' },
    });

    // Agrupar por estudiante
    const grouped = new Map();
    for (const record of absences) {
        const { student, course } = record;
        if (!grouped.has(student.documento)) {
            grouped.set(student.documento, {
                studentId:    student.documento,
                studentName:  student.name,
                email:        student.email,
                totalAbsences: 0,
                courses:      new Set(),
                weekStart,
                weekEnd,
            });
        }
        const entry = grouped.get(student.documento);
        entry.totalAbsences++;
        entry.courses.add(course.name);
    }

    // Convertir Sets a Arrays
    const result = Array.from(grouped.values()).map(entry => ({
        ...entry,
        courses: Array.from(entry.courses),
    }));

    console.log(`[attendanceService] Estudiantes con inasistencias: ${result.length}`);
    return result;
}
