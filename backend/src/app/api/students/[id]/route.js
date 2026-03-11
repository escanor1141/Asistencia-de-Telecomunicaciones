import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request,
    { params }
) {
    try {
        const { name, email, whatsapp } = await request.json()
        if (!name || name.trim() === '') {
            return Response.json({ error: 'Name is required' }, { status: 400 })
        }
        const student = await prisma.student.update({
            where: { id: params.id },
            data: {
                name: name.trim(),
                email: email ? email.trim() : null,
                whatsapp: whatsapp ? whatsapp.trim() : null,
            }
        })
        return Response.json(student)
    } catch (error) {
        return Response.json({ error: 'Failed to update student' }, { status: 500 })
    }
}

export async function DELETE(
    request,
    { params }
) {
    try {
        await prisma.student.delete({
            where: { id: params.id }
        })
        return Response.json({ success: true })
    } catch (error) {
        return Response.json({ error: 'Failed to delete student' }, { status: 500 })
    }
}
