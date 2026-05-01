import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT — actualizar datos de un estudiante
export async function PUT(request, { params }) {
    try {
        const { name, email, whatsapp } = await request.json()
        if (!name || name.trim() === '') {
            return Response.json({ error: 'El nombre es requerido' }, { status: 400 })
        }
        const estudiante = await prisma.student.update({
            where: { documento: params.id },
            data: {
                name: name.trim(),
                email: email ? email.trim() : null,
                whatsapp: whatsapp ? whatsapp.trim() : null,
            }
        })
        return Response.json({ ...estudiante, id: estudiante.documento })
    } catch (error) {
        return Response.json({ error: 'Error al actualizar estudiante' }, { status: 500 })
    }
}

// DELETE — eliminar un estudiante
export async function DELETE(request, { params }) {
    try {
        await prisma.student.delete({ where: { documento: params.id } })
        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: 'Error al eliminar estudiante' }, { status: 500 })
    }
}
