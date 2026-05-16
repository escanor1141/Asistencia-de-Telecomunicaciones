/**
 * attendanceService.js
 * Servicio para consultar las inasistencias semanales de estudiantes.
 */

import prisma from './prisma.js';
import { fmtBogota, getCurrentWeekRange } from './dateUtils.js';

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
