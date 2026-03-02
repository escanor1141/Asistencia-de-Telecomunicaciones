import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { name } = await request.json()
        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }
        const student = await prisma.student.update({
            where: { id: params.id },
            data: { name: name.trim() }
        })
        return NextResponse.json(student)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update student' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.student.delete({
            where: { id: params.id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 })
    }
}
