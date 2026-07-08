ALTER TABLE IF EXISTS public."Attendance" RENAME TO asistencias;
ALTER TABLE IF EXISTS public."AuditLog" RENAME TO registro_auditoria;
ALTER TABLE IF EXISTS public."Course" RENAME TO cursos;
ALTER TABLE IF EXISTS public."NotificationLog" RENAME TO registro_notificaciones;
ALTER TABLE IF EXISTS public."Student" RENAME TO estudiantes;
ALTER TABLE IF EXISTS public."Teacher" RENAME TO docentes;
ALTER TABLE IF EXISTS public."WhatsappNotificationLog" RENAME TO registro_notificaciones_whatsapp;

ALTER TABLE IF EXISTS public.asistencias RENAME COLUMN "studentId" TO estudiante_id;
ALTER TABLE IF EXISTS public.asistencias RENAME COLUMN "courseId" TO curso_id;
ALTER TABLE IF EXISTS public.asistencias RENAME COLUMN "date" TO fecha;
ALTER TABLE IF EXISTS public.asistencias RENAME COLUMN "present" TO presente;
ALTER TABLE IF EXISTS public.asistencias RENAME COLUMN "status" TO estado;
ALTER TABLE IF EXISTS public.asistencias RENAME COLUMN "createdAt" TO fecha_creacion;
ALTER TABLE IF EXISTS public.asistencias RENAME COLUMN "updatedAt" TO fecha_actualizacion;

ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "name" TO nombre;
ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "code" TO codigo;
ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "teacherId" TO docente_id;
ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "groupCode" TO grupo;
ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "academicPeriod" TO periodo_academico;
ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "academicYear" TO anio_academico;
ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "createdAt" TO fecha_creacion;
ALTER TABLE IF EXISTS public.cursos RENAME COLUMN "updatedAt" TO fecha_actualizacion;

ALTER TABLE IF EXISTS public.docentes RENAME COLUMN "id" TO id_docente;
ALTER TABLE IF EXISTS public.docentes RENAME COLUMN "passwordHash" TO contraseña;
ALTER TABLE IF EXISTS public.docentes RENAME COLUMN "name" TO nombre;
ALTER TABLE IF EXISTS public.docentes RENAME COLUMN "role" TO rol;
ALTER TABLE IF EXISTS public.docentes RENAME COLUMN "resetToken" TO token_recuperacion;
ALTER TABLE IF EXISTS public.docentes RENAME COLUMN "resetTokenExpiry" TO expiracion_token;
ALTER TABLE IF EXISTS public.docentes RENAME COLUMN "createdAt" TO fecha_creacion;

ALTER TABLE IF EXISTS public.estudiantes RENAME COLUMN "name" TO nombre;
ALTER TABLE IF EXISTS public.estudiantes RENAME COLUMN "createdAt" TO fecha_creacion;
ALTER TABLE IF EXISTS public.estudiantes RENAME COLUMN "updatedAt" TO fecha_actualizacion;

ALTER TABLE IF EXISTS public.registro_notificaciones RENAME COLUMN "studentId" TO estudiante_id;
ALTER TABLE IF EXISTS public.registro_notificaciones RENAME COLUMN "weekStart" TO semana_inicio;
ALTER TABLE IF EXISTS public.registro_notificaciones RENAME COLUMN "sentAt" TO enviado_en;
ALTER TABLE IF EXISTS public.registro_notificaciones RENAME COLUMN "status" TO estado;

ALTER TABLE IF EXISTS public.registro_notificaciones_whatsapp RENAME COLUMN "studentId" TO estudiante_id;
ALTER TABLE IF EXISTS public.registro_notificaciones_whatsapp RENAME COLUMN "courseId" TO curso_id;
ALTER TABLE IF EXISTS public.registro_notificaciones_whatsapp RENAME COLUMN "date" TO fecha;
ALTER TABLE IF EXISTS public.registro_notificaciones_whatsapp RENAME COLUMN "sentAt" TO enviado_en;
ALTER TABLE IF EXISTS public.registro_notificaciones_whatsapp RENAME COLUMN "status" TO estado;

ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "userId" TO usuario_id;
ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "userName" TO nombre_usuario;
ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "userRole" TO rol_usuario;
ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "action" TO accion;
ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "target" TO objetivo;
ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "targetId" TO objetivo_id;
ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "details" TO detalles;
ALTER TABLE IF EXISTS public.registro_auditoria RENAME COLUMN "createdAt" TO fecha_creacion;