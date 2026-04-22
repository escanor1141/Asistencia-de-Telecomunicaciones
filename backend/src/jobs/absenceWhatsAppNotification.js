/**
 * absenceWhatsAppNotification.js
 * Job que envía notificaciones de WhatsApp a estudiantes ausentes
 * cuando el profesor guarda la asistencia de una clase.
 *
 * Se ejecuta en fire-and-forget (no bloquea la respuesta HTTP).
 * Aplica un delay de WHATSAPP_SEND_DELAY_MS entre cada mensaje
 * para evitar bloqueos de WhatsApp/Evolution API.
 */

import prisma from '../lib/prisma.js';
import { sendWhatsAppMessage } from '../lib/whatsappService.js';

/** Espera N milisegundos (promesa) */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Construye el mensaje de texto para el estudiante ausente.
 *
 * @param {Object} params
 * @param {string} params.studentName
 * @param {string} params.date        - Formato YYYY-MM-DD
 * @param {string} params.courseName
 * @returns {string}
 */
function buildAbsenceMessage({ studentName, date, courseName }) {
    // Convertir YYYY-MM-DD a DD/MM/YYYY para el mensaje
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    return (
        `Estimado/a ${studentName}, le informamos que el día ${formattedDate} ` +
        `se registró una inasistencia en la asignatura ${courseName}. ` +
        `Si considera que existe un error, comuníquese con la coordinación académica.`
    );
}

/**
 * Orquesta el envío de notificaciones WhatsApp para una clase específica.
 *
 * @param {Array<{ studentId: string, present: boolean }>} records
 * @param {string} courseId
 * @param {string} date  - Formato YYYY-MM-DD
 */
export async function runAbsenceWhatsAppNotification(records, courseId, date) {
    const sendDelayMs = Number(process.env.WHATSAPP_SEND_DELAY_MS ?? 5000);

    console.log('\n════════════════════════════════════════');
    console.log('[whatsapp-job] Iniciando notificaciones de ausencia por WhatsApp...');
    console.log(`[whatsapp-job] Curso: ${courseId} | Fecha: ${date}`);
    console.log('════════════════════════════════════════\n');

    const stats = { sent: 0, skipped: 0, errors: 0 };

    try {
        // 1. Filtrar sólo los ausentes
        const absentIds = records
            .filter(r => !r.present)
            .map(r => r.studentId);

        if (absentIds.length === 0) {
            console.log('[whatsapp-job] No hay estudiantes ausentes. Nada que enviar.');
            return;
        }

        // 2. Obtener datos de estudiantes + nombre del curso en un solo query
        const [students, course] = await Promise.all([
            prisma.student.findMany({
                where: { id: { in: absentIds } },
                select: { id: true, name: true, whatsapp: true },
            }),
            prisma.course.findUnique({
                where: { id: courseId },
                select: { name: true },
            }),
        ]);

        if (!course) {
            console.error(`[whatsapp-job] Curso ${courseId} no encontrado.`);
            return;
        }

        // 3. Procesar cada estudiante
        for (const student of students) {
            const logBase = { studentId: student.id, courseId, date };

            // --- Sin número registrado ---
            if (!student.whatsapp) {
                console.warn(`[whatsapp-job] Sin WhatsApp: ${student.name} (${student.id})`);
                stats.skipped++;
                continue;
            }

            // --- Verificar duplicado: solo omitir si YA fue enviado con éxito ---
            // Si el intento anterior falló (ERROR), se debe reintentar
            const existing = await prisma.whatsappNotificationLog.findUnique({
                where: { studentId_courseId_date: logBase },
            });

            if (existing?.status === 'SUCCESS') {
                console.log(`[whatsapp-job] Ya notificado exitosamente: ${student.name} (${date}). Omitiendo.`);
                stats.skipped++;
                continue;
            }

            // --- Construir y enviar mensaje ---
            const message = buildAbsenceMessage({
                studentName: student.name,
                date,
                courseName: course.name,
            });

            const result = await sendWhatsAppMessage({
                phone: student.whatsapp,
                message,
            });

            // --- Registrar / actualizar en log ---
            await prisma.whatsappNotificationLog.upsert({
                where: { studentId_courseId_date: logBase },
                update: {
                    status: result.success ? 'SUCCESS' : 'ERROR',
                    error: result.success ? null : result.error,
                    sentAt: new Date(),
                },
                create: {
                    ...logBase,
                    status: result.success ? 'SUCCESS' : 'ERROR',
                    error: result.success ? null : result.error,
                },
            });

            if (result.success) {
                console.log(`[whatsapp-job] ✅ Enviado a ${student.name} (${student.whatsapp})`);
                stats.sent++;
            } else {
                console.error(`[whatsapp-job] ❌ Error enviando a ${student.name} — ${result.error}`);
                stats.errors++;
            }

            // --- Delay entre mensajes para evitar bans ---
            if (students.indexOf(student) < students.length - 1) {
                console.log(`[whatsapp-job] 🕐 Esperando ${sendDelayMs / 1000}s antes del próximo envío...`);
                await delay(sendDelayMs);
            }
        }
    } catch (err) {
        console.error('[whatsapp-job] Error crítico:', err.message);
        stats.errors++;
    }

    console.log('\n════════════════════════════════════════');
    console.log('[whatsapp-job] Resumen final:');
    console.log(`  ✅ Enviados:  ${stats.sent}`);
    console.log(`  ⏭️  Omitidos:  ${stats.skipped}`);
    console.log(`  ❌ Errores:   ${stats.errors}`);
    console.log('════════════════════════════════════════\n');
}
