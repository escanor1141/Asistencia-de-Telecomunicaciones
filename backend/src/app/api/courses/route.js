import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { obtenerUsuarioDePeticion } from '@/lib/auth'

export async function GET(request) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const whereClause = usuario.role === 'ADMIN' ? {} : { teacherId: usuario.id }

        const cursos = await prisma.course.findMany({
            where: whereClause,
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

        const { name, code, groupCode, academicPeriod, academicYear, dia, horaInicio, horaFin, dia2, horaInicio2, horaFin2, franja, programa } = await request.json()

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
                dia: dia?.trim() || null,
                horaInicio: horaInicio?.trim() || null,
                horaFin: horaFin?.trim() || null,
                dia2: dia2?.trim() || null,
                horaInicio2: horaInicio2?.trim() || null,
                horaFin2: horaFin2?.trim() || null,
                franja: franja?.trim() || null,
                programa: programa?.trim() || null,
                teacherId: usuario.id
            }
        })
        return Response.json(course, { status: 201 })
    } catch (error) {
        console.error('[Course API Error]:', error);
        if (error.code === 'P2002') {
            return Response.json({ error: 'Ya existe una materia con este código, grupo, periodo y año' }, { status: 400 })
        }
        return Response.json({ error: `Error al crear curso: ${error.message}` }, { status: 500 })
    }
}
