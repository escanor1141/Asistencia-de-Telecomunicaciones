/**
 * attendanceService.js
 * Servicio para consultar las inasistencias semanales de estudiantes.
 */

import prisma from './prisma.js';
import { fmtBogota, getCurrentWeekRange } from './dateUtils.js';
import * as XLSX from 'xlsx';

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

function sanearNombreHoja(rawName) {
    return rawName.replace(/[\\\/?*\[\]:]/g, '').trim().substring(0, 28) || 'Materia';
}

function obtenerNombreHojaUnico(rawName, usadas) {
    let nombre = sanearNombreHoja(rawName);
    let sufijo = 1;
    let nombreFinal = nombre;

    while (usadas.has(nombreFinal)) {
        const sufijoTexto = `-${sufijo}`;
        nombreFinal = `${nombre.substring(0, 31 - sufijoTexto.length)}${sufijoTexto}`;
        sufijo += 1;
    }

    usadas.add(nombreFinal);
    return nombreFinal;
}

/**
 * Genera un archivo Excel con una hoja por materia activa y los registros de asistencia de la semana.
 *
 * @param {Object} [options]
 * @param {Date} [options.referenceDate] - Fecha de referencia para calcular la semana
 * @returns {Promise<{ buffer: Buffer, weekStart: string, weekEnd: string, courseCount: number, totalRecords: number }>}
 */
export async function createWeeklyCourseExcelReport({ referenceDate } = {}) {
    const { weekStart, weekEnd } = getCurrentWeekRange(referenceDate);

    const [sy, sm, sd] = weekStart.split('-').map(Number);
    const [ey, em, ed] = weekEnd.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    const dates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(fmtBogota(d));
    }

    const courses = await prisma.course.findMany({
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            code: true,
            groupCode: true,
            academicPeriod: true,
            academicYear: true,
        },
    });

    const workbook = XLSX.utils.book_new();
    const hojasUsadas = new Set();

    const resumenSheet = XLSX.utils.json_to_sheet([
        { clave: 'Semana inicio', valor: weekStart },
        { clave: 'Semana fin', valor: weekEnd },
        { clave: 'Materias incluidas', valor: courses.length },
    ], { header: ['clave', 'valor'] });
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen');

    let totalRecords = 0;

    for (const course of courses) {
        const attendances = await prisma.attendance.findMany({
            where: {
                courseId: course.id,
                date: { in: dates },
            },
            include: {
                student: {
                    select: { documento: true, name: true },
                },
            },
            orderBy: [{ student: { name: 'asc' } }, { date: 'asc' }],
        });

        totalRecords += attendances.length;

        const rows = attendances.map((record) => ({
            Fecha: record.date,
            Documento: record.student.documento,
            Estudiante: record.student.name,
            Presente: record.present ? 'Sí' : 'No',
            Estado: record.status || '',
        }));

        const sheet = XLSX.utils.json_to_sheet(rows, {
            header: ['Fecha', 'Documento', 'Estudiante', 'Presente', 'Estado'],
        });

        const nombreBase = `${course.name} ${course.groupCode}`;
        const nombreHoja = obtenerNombreHojaUnico(nombreBase, hojasUsadas);
        XLSX.utils.book_append_sheet(workbook, sheet, nombreHoja);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return { buffer, weekStart, weekEnd, courseCount: courses.length, totalRecords };
}
