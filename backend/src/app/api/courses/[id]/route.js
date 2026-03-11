import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function PUT(request, { params }) {
    try {
        const user = getUserFromRequest(request)
        if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const { id } = params
        const { name, code } = await request.json()

        // Verify ownership
        const existing = await prisma.course.findUnique({ where: { id } })
        if (!existing || existing.teacherId !== user.id) {
            return Response.json({ error: 'Curso no encontrado o sin permiso' }, { status: 404 })
        }

        const updated = await prisma.course.update({
            where: { id },
            data: {
                name: name?.trim() || existing.name,
                code: code?.trim() || existing.code
            }
        })
        return NextResponse.json(updated)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al actualizar curso' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = getUserFromRequest(request)
        if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 })

        const { id } = params

        const existing = await prisma.course.findUnique({ where: { id } })
        if (!existing || existing.teacherId !== user.id) {
            return Response.json({ error: 'Curso no encontrado o sin permiso' }, { status: 404 })
        }

        await prisma.course.delete({ where: { id } })
        return Response.json({ success: true })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al eliminar curso' }, { status: 500 })
    }
}
