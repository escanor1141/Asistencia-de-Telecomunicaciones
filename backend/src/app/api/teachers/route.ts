import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET — list all teachers
export async function GET() {
    try {
        const teachers = await prisma.teacher.findMany({
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        })
        return NextResponse.json(teachers)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al obtener profesores' }, { status: 500 })
    }
}

// POST — create a teacher
export async function POST(request: Request) {
    try {
        const { name, email, password } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
        }

        const existing = await prisma.teacher.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json({ error: 'Ya existe un profesor con ese email' }, { status: 409 })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const teacher = await prisma.teacher.create({
            data: { name, email, passwordHash },
            select: { id: true, name: true, email: true, createdAt: true }
        })

        return NextResponse.json(teacher, { status: 201 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error al crear profesor' }, { status: 500 })
    }
}
