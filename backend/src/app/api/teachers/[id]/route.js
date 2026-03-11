import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE — remove a teacher
export async function DELETE(request, { params }) {
    try {
        const { id } = params
        await prisma.teacher.delete({ where: { id } })
        return Response.json({ success: true })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al eliminar profesor' }, { status: 500 })
    }
}
