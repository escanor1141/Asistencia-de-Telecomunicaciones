import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request) {
    try {
        const user = getUserFromRequest(request)
        if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const courses = await prisma.course.findMany({
            where: { teacherId: user.id },
            orderBy: { name: 'asc' }
        })
        return Response.json(courses)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al cargar cursos' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const user = getUserFromRequest(request)
        if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const { name, code } = await request.json()

        if (!name || !code || name.trim() === '' || code.trim() === '') {
            return Response.json({ error: 'Nombre y código son requeridos' }, { status: 400 })
        }

        const course = await prisma.course.create({
            data: {
                name: name.trim(),
                code: code.trim(),
                teacherId: user.id
            }
        })
        return Response.json(course, { status: 201 })
    } catch (error) {
        console.error(error)
        if (error.code === 'P2002') {
            return Response.json({ error: 'Ya existe un curso con este código' }, { status: 400 })
        }
        return Response.json({ error: 'Error al crear curso' }, { status: 500 })
    }
}
