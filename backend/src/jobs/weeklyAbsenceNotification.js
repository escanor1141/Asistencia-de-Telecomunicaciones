/**
 * notificacionSemanalAusencias.js
 * Job principal que orquesta el envío de notificaciones de inasistencias semanales.
 */

import prisma from '../lib/prisma.js';
import { sendEmail, buildAbsenceEmailHTML, buildWeeklyReportEmailHTML } from '../lib/emailService.js';
import { getWeeklyAbsences, createWeeklyCourseExcelReport } from '../lib/attendanceService.js';

/**
 * Ejecuta el proceso de notificación semanal de inasistencias.
 * @returns {Promise<{ sent: number, skipped: number, errors: number, details: Array }>}
 */
export async function runWeeklyNotification() {
    console.log('\n========================================');
    console.log('[notification-job] Iniciando envío de notificaciones semanales...');
    console.log(`[notification-job] Hora: ${new Date().toISOString()}`);
    console.log('========================================\n');

    const resultados = { sent: 0, skipped: 0, errors: 0, details: [] };

    try {
        // 1. Generar y enviar reporte Excel semanal de materias activas
        const weeklyReportRecipient = process.env.WEEKLY_REPORT_RECIPIENT_EMAIL || process.env.BREVO_SENDER_EMAIL;
        if (weeklyReportRecipient) {
            try {
                const { buffer, weekStart, weekEnd, courseCount, totalRecords } = await createWeeklyCourseExcelReport();
                const attachmentName = `reporte-semanal-materias-${weekStart}.xlsx`;
                const htmlContent = buildWeeklyReportEmailHTML({ weekStart, weekEnd, courseCount, totalRecords });

                const reportResult = await sendEmail({
                    to: weeklyReportRecipient,
                    toName: process.env.WEEKLY_REPORT_RECIPIENT_NAME || 'Coordinador',
                    subject: `Reporte semanal de materias activas (${weekStart} - ${weekEnd})`,
                    htmlContent,
                    attachments: [{ name: attachmentName, content: buffer.toString('base64') }],
                });

                if (reportResult.success) {
                    console.log(`[notification-job] ✅ Reporte semanal enviado a: ${weeklyReportRecipient}`);
                } else {
                    console.error(`[notification-job] ❌ Error enviando reporte semanal a ${weeklyReportRecipient}: ${reportResult.error}`);
                }
            } catch (err) {
                console.error('[notification-job] Error generando o enviando reporte semanal:', err.message);
            }
        } else {
            console.log('[notification-job] No hay WEEKLY_REPORT_RECIPIENT_EMAIL configurado. Se omite envío de reporte semanal en Excel.');
        }

        // 2. Obtener inasistencias agrupadas por estudiante
        const listaInasistencias = await getWeeklyAbsences();

        if (listaInasistencias.length === 0) {
            console.log('[notification-job] Sin inasistencias en la semana. No se envían correos.');
            return resultados;
        }

        for (const estudiante of listaInasistencias) {
            const entradaLog = {
                studentId: estudiante.studentId,
                studentName: estudiante.studentName,
                email: estudiante.email,
                weekStart: estudiante.weekStart,
                status: null,
                reason: null,
            };

            // 2. Saltar si no tiene email registrado
            if (!estudiante.email) {
                console.warn(`[notification-job] Sin email: ${estudiante.studentName} (${estudiante.studentId})`);
                entradaLog.status = 'SKIPPED';
                entradaLog.reason = 'Sin email registrado';
                resultados.skipped++;
                resultados.details.push(entradaLog);
                continue;
            }

            // 3. Verificar si ya se envió correo esta semana (evitar duplicados)
            const existente = await prisma.notificationLog.findUnique({
                where: {
                    studentId_weekStart: {
                        studentId: estudiante.studentId,
                        weekStart: estudiante.weekStart,
                    },
                },
            });

            if (existente) {
                console.log(`[notification-job] Duplicado omitido: ${estudiante.studentName} (semana ${estudiante.weekStart})`);
                entradaLog.status = 'SKIPPED';
                entradaLog.reason = 'Ya se envió correo esta semana';
                resultados.skipped++;
                resultados.details.push(entradaLog);
                continue;
            }

            // 4. Construir y enviar correo
            const contenidoHtml = buildAbsenceEmailHTML({
                studentName: estudiante.studentName,
                totalAbsences: estudiante.totalAbsences,
                courses: estudiante.courses,
                weekStart: estudiante.weekStart,
                weekEnd: estudiante.weekEnd,
            });

            const resultadoCorreo = await sendEmail({
                to: estudiante.email,
                toName: estudiante.studentName,
                subject: 'Reporte semanal de inasistencias',
                htmlContent: contenidoHtml,
            });

            // 5. Registrar en NotificationLog
            if (resultadoCorreo.success) {
                await prisma.notificationLog.create({
                    data: {
                        studentId: estudiante.studentId,
                        weekStart: estudiante.weekStart,
                        status: 'SUCCESS',
                    },
                });
                console.log(`[notification-job] ✅ Enviado a: ${estudiante.email} (${estudiante.studentName})`);
                entradaLog.status = 'SUCCESS';
                resultados.sent++;
            } else {
                await prisma.notificationLog.create({
                    data: {
                        studentId: estudiante.studentId,
                        weekStart: estudiante.weekStart,
                        status: 'ERROR',
                        error: resultadoCorreo.error,
                    },
                });
                console.error(`[notification-job] ❌ Error enviando a: ${estudiante.email} — ${resultadoCorreo.error}`);
                entradaLog.status = 'ERROR';
                entradaLog.reason = resultadoCorreo.error;
                resultados.errors++;
            }

            resultados.details.push(entradaLog);
        }
    } catch (err) {
        console.error('[notification-job] Error crítico:', err.message);
        resultados.errors++;
    }

    console.log('\n========================================');
    console.log('[notification-job] Resumen final:');
    console.log(`  ✅ Enviados:  ${resultados.sent}`);
    console.log(`  ⏭️  Omitidos:  ${resultados.skipped}`);
    console.log(`  ❌ Errores:   ${resultados.errors}`);
    console.log('========================================\n');

    return resultados;
}
