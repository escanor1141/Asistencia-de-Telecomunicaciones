/**
 * attendanceService.js
 * Servicio para consultar las inasistencias semanales de estudiantes
 * y generar los reportes Excel de asistencia por docente.
 */

import prisma from './prisma.js';
import { fmtBogota, getPreviousWeekRange } from './dateUtils.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx-js-style');

/**
 * Obtiene las inasistencias de la semana ANTERIOR agrupadas por estudiante.
 */
export async function getWeeklyAbsences({ referenceDate } = {}) {
    const { weekStart, weekEnd } = getPreviousWeekRange(referenceDate);

    console.log(`[attendanceService] Consultando inasistencias del ${weekStart} al ${weekEnd}`);

    const dates = [];
    const [sy, sm, sd] = weekStart.split('-').map(Number);
    const [ey, em, ed] = weekEnd.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end   = new Date(ey, em - 1, ed);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(fmtBogota(d));
    }

    const absences = await prisma.attendance.findMany({
        where: {
            present: false,
            date: { in: dates },
        },
        include: {
            student: { select: { documento: true, name: true, email: true } },
            course:  { select: { name: true } },
        },
        orderBy: { date: 'asc' },
    });

    const grouped = new Map();
    for (const record of absences) {
        const { student, course } = record;
        if (!grouped.has(student.documento)) {
            grouped.set(student.documento, {
                studentId:     student.documento,
                studentName:   student.name,
                email:         student.email,
                totalAbsences: 0,
                courses:       new Set(),
                weekStart,
                weekEnd,
            });
        }
        const entry = grouped.get(student.documento);
        entry.totalAbsences++;
        entry.courses.add(course.name);
    }

    const result = Array.from(grouped.values()).map(entry => ({
        ...entry,
        courses: Array.from(entry.courses),
    }));

    console.log(`[attendanceService] Estudiantes con inasistencias: ${result.length}`);
    return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatearNombre(nombre) {
    if (!nombre) return '';
    return nombre.toLowerCase().split(' ')
        .map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function compararPorApellido(a, b) {
    const apellido = (n) => {
        const palabras = (n || '').trim().split(/\s+/);
        return (palabras.length > 2
            ? palabras.slice(-2).join(' ')
            : palabras[palabras.length - 1] || '').toLowerCase();
    };
    return apellido(a).localeCompare(apellido(b), 'es');
}

function fmtCabecera(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function crearEstilos() {
    const border = {
        top:    { style: 'thin', color: { rgb: 'E2E6EF' } },
        bottom: { style: 'thin', color: { rgb: 'E2E6EF' } },
        left:   { style: 'thin', color: { rgb: 'E2E6EF' } },
        right:  { style: 'thin', color: { rgb: 'E2E6EF' } },
    };
    const baseFont = { name: 'Arial', sz: 10 };
    return {
        sLabel:    { fill: { fgColor: { rgb: '6B2D8B' } }, font: { ...baseFont, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'left',   vertical: 'center' }, border },
        sValor:    { font: baseFont, alignment: { horizontal: 'left',   vertical: 'center' }, border },
        sEnc:      { fill: { fgColor: { rgb: '6B2D8B' } }, font: { ...baseFont, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border },
        sEncLeft:  { fill: { fgColor: { rgb: '6B2D8B' } }, font: { ...baseFont, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'left',   vertical: 'center' }, border },
        sNormal:   { font: baseFont, alignment: { horizontal: 'left',   vertical: 'center' }, border },
        sCentrado: { font: baseFont, alignment: { horizontal: 'center', vertical: 'center' }, border },
        sP:        { fill: { fgColor: { rgb: 'F2F9E7' } }, font: { ...baseFont, bold: true, color: { rgb: '8DC63F' } }, alignment: { horizontal: 'center', vertical: 'center' }, border },
        sA:        { fill: { fgColor: { rgb: 'FEF2F2' } }, font: { ...baseFont, bold: true, color: { rgb: 'DC2626' } }, alignment: { horizontal: 'center', vertical: 'center' }, border },
        sJ:        { fill: { fgColor: { rgb: 'F3EBF8' } }, font: { ...baseFont, bold: true, color: { rgb: '6B2D8B' } }, alignment: { horizontal: 'center', vertical: 'center' }, border },
        sSin:      { font: baseFont, alignment: { horizontal: 'center', vertical: 'center' }, border },
    };
}

/**
 * Genera un Excel de asistencia para UN docente específico.
 * Contiene una hoja por cada materia del docente con:
 *   - Perfil del curso
 *   - TABLA 1: Asistencia por día (P/A/J/–)
 *   - TABLA 2: Directorio de contacto de estudiantes
 *
 * @param {Object} params
 * @param {string} params.teacherId    - ID del docente
 * @param {string} params.weekStart    - Fecha inicio semana (YYYY-MM-DD)
 * @param {string} params.weekEnd      - Fecha fin semana   (YYYY-MM-DD)
 * @param {string[]} params.dates      - Array de fechas de la semana
 * @returns {Promise<Buffer|null>}     - Buffer del Excel, o null si el docente no tiene cursos con estudiantes
 */
async function generarExcelDocente({ teacherId, weekStart, weekEnd, dates }) {
    const fechasCab = dates.map(fmtCabecera);
    const estilos   = crearEstilos();

    // Cursos del docente
    const courses = await prisma.course.findMany({
        where: { teacherId },
        orderBy: [{ name: 'asc' }, { groupCode: 'asc' }],
        include: { teacher: { select: { name: true } } },
    });

    if (courses.length === 0) return null;

    const wb = XLSX.utils.book_new();
    const nombresUsados = new Set();
    let hojasScritas = 0;

    for (const curso of courses) {
        // Estudiantes del curso (derivados de asistencias históricas)
        const estudiantesRaw = await prisma.student.findMany({
            where: { attendances: { some: { courseId: curso.id } } },
            select: {
                documento: true,
                name:      true,
                email:     true,
                correo2:   true,
                whatsapp:  true,
                telefono2: true,
            },
        });

        if (estudiantesRaw.length === 0) continue;

        const estudiantes = [...estudiantesRaw].sort((a, b) =>
            compararPorApellido(a.name, b.name)
        );

        // Asistencia de la semana para este curso
        const asistencias = await prisma.attendance.findMany({
            where: { courseId: curso.id, date: { in: dates } },
            select: { studentId: true, date: true, present: true, status: true },
        });

        const mapa = {};
        for (const reg of asistencias) {
            if (!mapa[reg.studentId]) mapa[reg.studentId] = {};
            mapa[reg.studentId][reg.date] = reg;
        }

        // Construir hoja
        const ws       = {};
        const rowsMeta = [];
        let r = 0;

        const addCell = (row, col, val, sty) => {
            ws[XLSX.utils.encode_cell({ r: row, c: col })] = {
                v: val ?? '',
                t: typeof val === 'number' ? 'n' : 's',
                s: sty,
            };
        };

        // ── Perfil del curso ──────────────────────────────────────────────
        const perfil = [
            ['Docente:',  curso.teacher?.name || ''],
            ['Correo:',   ''],  // email del docente no está en modelo Teacher; se puede agregar
            ['Materia:',  curso.name || ''],
            ['Código:',   curso.code || ''],
            ['Grupo:',    curso.groupCode || ''],
            ['Período:',  curso.academicPeriod || ''],
            ['Año:',      curso.academicYear || ''],
            ['Semana:',   `${fechasCab[0]} – ${fechasCab[5]}`],
        ];
        for (const [lbl, val] of perfil) {
            addCell(r, 0, lbl, estilos.sLabel);
            addCell(r, 1, val, estilos.sValor);
            rowsMeta.push({ hpt: 20 }); r++;
        }
        rowsMeta.push({ hpt: 8 }); r++;

        // ── TABLA 1: Asistencia ───────────────────────────────────────────
        ['Documento', 'Nombre del Alumno', ...fechasCab].forEach((t, c) =>
            addCell(r, c, t, estilos.sEnc)
        );
        rowsMeta.push({ hpt: 28 }); r++;

        for (const est of estudiantes) {
            addCell(r, 0, est.documento,             estilos.sCentrado);
            addCell(r, 1, formatearNombre(est.name), estilos.sNormal);
            dates.forEach((fecha, c) => {
                const reg = mapa[est.documento]?.[fecha];
                let v = '–', s = estilos.sSin;
                if (reg) {
                    const estado = reg.status || (reg.present ? 'Presente' : 'Ausente');
                    if (estado === 'Presente')    { v = 'P'; s = estilos.sP; }
                    else if (estado === 'Ausente')     { v = 'A'; s = estilos.sA; }
                    else if (estado === 'Justificado') { v = 'J'; s = estilos.sJ; }
                }
                addCell(r, 2 + c, v, s);
            });
            rowsMeta.push({ hpt: 20 }); r++;
        }

        rowsMeta.push({ hpt: 8 }); r++;

        // ── TABLA 2: Directorio de contacto ──────────────────────────────
        ['Documento', 'Nombre del Alumno', 'Correo Institucional', 'Correo Adicional', 'Número WhatsApp', 'Número Adicional']
            .forEach((t, c) => addCell(r, c, t, estilos.sEncLeft));
        rowsMeta.push({ hpt: 28 }); r++;

        for (const est of estudiantes) {
            addCell(r, 0, est.documento,             estilos.sCentrado);
            addCell(r, 1, formatearNombre(est.name), estilos.sNormal);
            addCell(r, 2, est.email     || '',       estilos.sNormal);
            addCell(r, 3, est.correo2   || '',       estilos.sNormal);
            addCell(r, 4, est.whatsapp  || '',       estilos.sNormal);
            addCell(r, 5, est.telefono2 || '',       estilos.sNormal);
            rowsMeta.push({ hpt: 20 }); r++;
        }

        // ── Metadatos de hoja ─────────────────────────────────────────────
        ws['!ref']  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: 7 } });
        ws['!rows'] = rowsMeta;
        ws['!cols'] = [
            { wch: 15 }, { wch: 30 },
            { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 16 },
        ];

        const base = (curso.name || 'Materia').replace(/[\\/?*[\]:]/g, '').trim();
        const suf  = curso.groupCode ? ` (${curso.groupCode})` : '';
        let nombreHoja = (base + suf).substring(0, 31);
        let sufIdx = 1;
        while (nombresUsados.has(nombreHoja)) {
            const extra = `-${sufIdx++}`;
            nombreHoja  = (base + suf).substring(0, 31 - extra.length) + extra;
        }
        nombresUsados.add(nombreHoja);

        XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
        hojasScritas++;
    }

    if (hojasScritas === 0) return null;

    return Buffer.from(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}

/**
 * Genera y retorna un Excel por docente para todos los docentes del sistema.
 * Devuelve un array de { teacherName, buffer, weekStart, weekEnd, courseCount }.
 *
 * @param {Object} [options]
 * @param {Date} [options.referenceDate]
 */
export async function createWeeklyReportsByTeacher({ referenceDate } = {}) {
    const { weekStart, weekEnd } = getPreviousWeekRange(referenceDate);

    console.log(`[attendanceService] Generando reportes por docente: ${weekStart} → ${weekEnd}`);

    // Fechas lunes–sábado
    const dates = [];
    const [sy, sm, sd] = weekStart.split('-').map(Number);
    const [ey, em, ed] = weekEnd.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end   = new Date(ey, em - 1, ed);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(fmtBogota(d));
    }

    // Obtener solo docentes que tienen cursos
    const teachers = await prisma.teacher.findMany({
        where: { courses: { some: {} } },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
    });

    const reportes = [];

    for (const teacher of teachers) {
        const buffer = await generarExcelDocente({
            teacherId: teacher.id,
            weekStart,
            weekEnd,
            dates,
        });

        if (!buffer) {
            console.log(`[attendanceService] Sin cursos con estudiantes para: ${teacher.name}`);
            continue;
        }

        // Contar cursos del docente
        const courseCount = await prisma.course.count({ where: { teacherId: teacher.id } });

        reportes.push({
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            buffer,
            weekStart,
            weekEnd,
            courseCount,
        });

        console.log(`[attendanceService] Reporte generado: ${teacher.name} (${courseCount} materias)`);
    }

    return reportes;
}

/**
 * @deprecated Usar createWeeklyReportsByTeacher en su lugar.
 * Mantenido por compatibilidad con código existente.
 */
export async function createWeeklyCourseExcelReport({ referenceDate } = {}) {
    const reportes = await createWeeklyReportsByTeacher({ referenceDate });
    if (reportes.length === 0) return { buffer: Buffer.alloc(0), weekStart: '', weekEnd: '', courseCount: 0, totalRecords: 0 };
    const r = reportes[0];
    return { buffer: r.buffer, weekStart: r.weekStart, weekEnd: r.weekEnd, courseCount: r.courseCount, totalRecords: 0 };
}
