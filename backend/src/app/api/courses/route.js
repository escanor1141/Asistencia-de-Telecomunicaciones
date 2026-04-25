import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { obtenerUsuarioDePeticion } from '@/lib/auth'

export async function GET(request) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const cursos = await prisma.course.findMany({
            where: { teacherId: usuario.id },
            orderBy: { name: 'asc' }
        })
        return Response.json(cursos)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al cargar cursos' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const { name, code, groupCode, academicPeriod, academicYear } = await request.json()

        if (!name || !code || name.trim() === '' || code.trim() === '') {
            return Response.json({ error: 'Nombre y código son requeridos' }, { status: 400 })
        }

        const course = await prisma.course.create({
            data: {
                name: name.trim(),
                code: code.trim(),
                groupCode: groupCode?.trim() || 'A',
                academicPeriod: academicPeriod || '1',
                academicYear: academicYear || '2024',
                teacherId: usuario.id
            }
        })
        return Response.json(course, { status: 201 })
    } catch (error) {
        console.error(error)
        if (error.code === 'P2002') {
            return Response.json({ error: 'Ya existe una materia con este código, grupo, periodo y año' }, { status: 400 })
        }
        return Response.json({ error: 'Error al crear curso' }, { status: 500 })
    }
}
