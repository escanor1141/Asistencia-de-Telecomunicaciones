import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT — actualizar datos de un estudiante
export async function PUT(request, { params }) {
    try {
        const { name, email, correo2, whatsapp, telefono2, franja, programa } = await request.json()
        if (!name || name.trim() === '') {
            return Response.json({ error: 'El nombre es requerido' }, { status: 400 })
        }
        const estudiante = await prisma.student.update({
            where: { documento: params.id },
            data: {
                name:      name.trim(),
                email:     email     ? email.trim()     : null,
                correo2:   correo2   ? correo2.trim()   : null,
                whatsapp:  whatsapp  ? whatsapp.trim()  : null,
                telefono2: telefono2 ? telefono2.trim() : null,
                franja:    franja    ? franja.trim()    : null,
                programa:  programa  ? programa.trim()  : null,
            }
        })
        return Response.json({ ...estudiante, id: estudiante.documento })
    } catch (error) {
        return Response.json({ error: 'Error al actualizar estudiante' }, { status: 500 })
    }
}

// DELETE — eliminar o desconectar un estudiante de un curso
export async function DELETE(request, { params }) {
    try {
        const { searchParams } = new URL(request.url);
        const idCurso = searchParams.get('courseId');

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 });
        }

        // Primero verificamos el estudiante y sus cursos
        const estudiante = await prisma.student.findUnique({
            where: { documento: params.id },
            include: { courses: true }
        });

        if (!estudiante) {
            return Response.json({ error: 'Estudiante no encontrado' }, { status: 404 });
        }

        if (estudiante.courses.length <= 1) {
            // Si solo tiene este curso, borramos el estudiante completo
            await prisma.student.delete({ where: { documento: params.id } });
        } else {
            // Si tiene otros cursos, solo lo desconectamos de este curso
            await prisma.student.update({
                where: { documento: params.id },
                data: {
                    courses: { disconnect: { id: idCurso } }
                }
            });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: 'Error al eliminar estudiante' }, { status: 500 });
    }
}
