import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET — obtener lista de estudiantes de un curso
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const idCurso = searchParams.get('courseId')

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        const estudiantes = await prisma.student.findMany({
            where: { courseId: idCurso },
            orderBy: { name: 'asc' }
        })
        return Response.json(estudiantes)
    } catch (error) {
        return Response.json({ error: 'Error al obtener estudiantes' }, { status: 500 })
    }
}

// POST — crear uno o múltiples estudiantes (importación CSV)
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url)
        const idCurso = searchParams.get('courseId')

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        const cuerpo = await request.json()
        // Soporte para inserción individual o masiva (CSV)
        if (Array.isArray(cuerpo)) {
            const datos = cuerpo
                .filter((e) => e.name && e.name.trim() !== '')
                .map((e) => ({
                    name: e.name.trim(),
                    email: e.email ? e.email.trim() : null,
                    whatsapp: e.whatsapp ? e.whatsapp.trim() : null,
                    courseId: idCurso,
                }))

            const creados = await prisma.student.createMany({
                data: datos,
                skipDuplicates: true,
            })
            return Response.json({ count: creados.count }, { status: 201 })
        }

        const { name, email, whatsapp } = cuerpo
        if (!name || name.trim() === '') {
            return Response.json({ error: 'El nombre es requerido' }, { status: 400 })
        }

        const estudiante = await prisma.student.create({
            data: {
                name: name.trim(),
                email: email ? email.trim() : null,
                whatsapp: whatsapp ? whatsapp.trim() : null,
                courseId: idCurso,
            }
        })
        return Response.json(estudiante, { status: 201 })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al crear estudiante' }, { status: 500 })
    }
}
