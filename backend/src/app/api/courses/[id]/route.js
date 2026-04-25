import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { obtenerUsuarioDePeticion } from '@/lib/auth'

// PUT — actualizar curso
export async function PUT(request, { params }) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const { id } = params
        const { name, code } = await request.json()

        // Verificar propiedad del curso
        const existente = await prisma.course.findUnique({ where: { id } })
        if (!existente || existente.teacherId !== usuario.id) {
            return Response.json({ error: 'Curso no encontrado o sin permiso' }, { status: 404 })
        }

        const actualizado = await prisma.course.update({
            where: { id },
            data: {
                name: name?.trim() || existente.name,
                code: code?.trim() || existente.code
            }
        })
        return NextResponse.json(actualizado)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al actualizar curso' }, { status: 500 })
    }
}

// DELETE — eliminar curso
export async function DELETE(request, { params }) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const { id } = params

        const existente = await prisma.course.findUnique({ where: { id } })
        if (!existente || existente.teacherId !== usuario.id) {
            return Response.json({ error: 'Curso no encontrado o sin permiso' }, { status: 404 })
        }

        await prisma.course.delete({ where: { id } })
        return Response.json({ success: true })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al eliminar curso' }, { status: 500 })
    }
}
