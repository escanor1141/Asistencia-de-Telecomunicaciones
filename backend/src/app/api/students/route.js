import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        const students = await prisma.student.findMany({
            where: { courseId },
            orderBy: { name: 'asc' }
        })
        return Response.json(students)
    } catch (error) {
        return Response.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url)
        const courseId = searchParams.get('courseId')

        if (!courseId) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        const body = await request.json()
        // Support single or multiple insertions (for CSV import)
        if (Array.isArray(body)) {
            // Create valid students from array
            const data = body
                .filter((s) => s.name && s.name.trim() !== '')
                .map((s) => ({
                    name: s.name.trim(),
                    email: s.email ? s.email.trim() : null,
                    whatsapp: s.whatsapp ? s.whatsapp.trim() : null,
                    courseId,
                }))

            const created = await prisma.student.createMany({
                data,
                skipDuplicates: true,
            })
            return Response.json({ count: created.count }, { status: 201 })
        }

        const { name, email, whatsapp } = body
        if (!name || name.trim() === '') {
            return Response.json({ error: 'Name is required' }, { status: 400 })
        }

        const student = await prisma.student.create({
            data: {
                name: name.trim(),
                email: email ? email.trim() : null,
                whatsapp: whatsapp ? whatsapp.trim() : null,
                courseId,
            }
        })
        return Response.json(student, { status: 201 })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Failed to create student' }, { status: 500 })
    }
}
