/**
 * weeklyAbsenceNotification.js
 * Job principal que orquesta el envío de notificaciones de inasistencias semanales.
 */

import prisma from '../lib/prisma.js';
import { sendEmail, buildAbsenceEmailHTML } from '../lib/emailService.js';
import { getWeeklyAbsences } from '../lib/attendanceService.js';

/**
 * Ejecuta el proceso de notificación semanal de inasistencias.
 * @returns {Promise<{ sent: number, skipped: number, errors: number, details: Array }>}
 */
export async function runWeeklyNotification() {
    console.log('\n========================================');
    console.log('[notification-job] Iniciando envío de notificaciones semanales...');
    console.log(`[notification-job] Hora: ${new Date().toISOString()}`);
    console.log('========================================\n');

    const results = { sent: 0, skipped: 0, errors: 0, details: [] };

    try {
        // 1. Obtener inasistencias agrupadas por estudiante
        const absenceList = await getWeeklyAbsences();

        if (absenceList.length === 0) {
            console.log('[notification-job] Sin inasistencias en la semana. No se envían correos.');
            return results;
        }

        for (const student of absenceList) {
            const logEntry = {
                studentId: student.studentId,
                studentName: student.studentName,
                email: student.email,
                weekStart: student.weekStart,
                status: null,
                reason: null,
            };

            // 2. Saltar si no tiene email registrado
            if (!student.email) {
                console.warn(`[notification-job] Sin email: ${student.studentName} (${student.studentId})`);
                logEntry.status = 'SKIPPED';
                logEntry.reason = 'Sin email registrado';
                results.skipped++;
                results.details.push(logEntry);
                continue;
            }

            // 3. Verificar si ya se envió correo esta semana (evitar duplicados)
            const existing = await prisma.notificationLog.findUnique({
                where: {
                    studentId_weekStart: {
                        studentId: student.studentId,
                        weekStart: student.weekStart,
                    },
                },
            });

            if (existing) {
                console.log(`[notification-job] Duplicado omitido: ${student.studentName} (semana ${student.weekStart})`);
                logEntry.status = 'SKIPPED';
                logEntry.reason = 'Ya se envió correo esta semana';
                results.skipped++;
                results.details.push(logEntry);
                continue;
            }

            // 4. Construir y enviar correo
            const htmlContent = buildAbsenceEmailHTML({
                studentName: student.studentName,
                totalAbsences: student.totalAbsences,
                courses: student.courses,
                weekStart: student.weekStart,
                weekEnd: student.weekEnd,
            });

            const emailResult = await sendEmail({
                to: student.email,
                toName: student.studentName,
                subject: 'Reporte semanal de inasistencias',
                htmlContent,
            });

            // 5. Registrar en NotificationLog
            if (emailResult.success) {
                await prisma.notificationLog.create({
                    data: {
                        studentId: student.studentId,
                        weekStart: student.weekStart,
                        status: 'SUCCESS',
                    },
                });
                console.log(`[notification-job] ✅ Enviado a: ${student.email} (${student.studentName})`);
                logEntry.status = 'SUCCESS';
                results.sent++;
            } else {
                await prisma.notificationLog.create({
                    data: {
                        studentId: student.studentId,
                        weekStart: student.weekStart,
                        status: 'ERROR',
                        error: emailResult.error,
                    },
                });
                console.error(`[notification-job] ❌ Error enviando a: ${student.email} — ${emailResult.error}`);
                logEntry.status = 'ERROR';
                logEntry.reason = emailResult.error;
                results.errors++;
            }

            results.details.push(logEntry);
        }
    } catch (err) {
        console.error('[notification-job] Error crítico:', err.message);
        results.errors++;
    }

    console.log('\n========================================');
    console.log(`[notification-job] Resumen final:`);
    console.log(`  ✅ Enviados:  ${results.sent}`);
    console.log(`  ⏭️  Omitidos:  ${results.skipped}`);
    console.log(`  ❌ Errores:   ${results.errors}`);
    console.log('========================================\n');

    return results;
}
