import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// DELETE — remove a teacher
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        await prisma.teacher.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al eliminar profesor' }, { status: 500 })
    }
}
