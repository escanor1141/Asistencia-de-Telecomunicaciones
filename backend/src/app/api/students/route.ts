import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const students = await prisma.student.findMany({
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(students)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        // Support single or multiple insertions (for CSV import)
        if (Array.isArray(body)) {
            // Create valid students from array
            const data = body
                .filter((s: any) => s.name && s.name.trim() !== '')
                .map((s: any) => ({ name: s.name.trim() }))

            const created = await prisma.student.createMany({
                data,
                skipDuplicates: true,
            })
            return NextResponse.json({ count: created.count }, { status: 201 })
        }

        const { name } = body
        if (!name || name.trim() === '') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const student = await prisma.student.create({ data: { name: name.trim() } })
        return NextResponse.json(student, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create student' }, { status: 500 })
    }
}
