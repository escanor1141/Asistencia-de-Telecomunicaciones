/**
 * attendanceService.js
 * Servicio para consultar las inasistencias semanales de estudiantes.
 */

import prisma from './prisma.js';

/**
 * Calcula el lunes (inicio) y el sábado (fin) de la semana actual.
 * @param {Date} [referenceDate=new Date()] - Fecha de referencia (default: hoy)
 * @returns {{ weekStart: string, weekEnd: string }} - Fechas en formato YYYY-MM-DD
 */
export function getCurrentWeekRange(referenceDate = new Date()) {
    const date = new Date(referenceDate);
    const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb

    // Calcular días al lunes anterior (o el mismo día si es lunes)
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // Sábado = lunes + 5 días
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    const fmt = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD
    return {
        weekStart: fmt(monday),
        weekEnd: fmt(saturday),
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

    // Generar rango de fechas lunes-sábado
    const dates = [];
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(weekEnd + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
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
                studentId: student.documento,
                studentName: student.name,
                email: student.email,
                totalAbsences: 0,
                courses: new Set(),
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
