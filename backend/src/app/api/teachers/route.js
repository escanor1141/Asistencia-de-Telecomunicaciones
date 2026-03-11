import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getUserFromRequest } from '@/lib/auth'

// GET — list all teachers
export async function GET(request) {
    try {
        const user = getUserFromRequest(request)
        if (!user || user.role !== 'ADMIN') {
            return Response.json({ error: 'No autorizado' }, { status: 403 })
        }

        const teachers = await prisma.teacher.findMany({
            select: { id: true, name: true, email: true, createdAt: true, role: true },
            orderBy: { createdAt: 'asc' }
        })
        return Response.json(teachers)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al obtener profesores' }, { status: 500 })
    }
}

// POST — create a teacher
export async function POST(request) {
    try {
        const user = getUserFromRequest(request)
        if (!user || user.role !== 'ADMIN') {
            return Response.json({ error: 'No autorizado' }, { status: 403 })
        }

        const { name, email, password, role } = await request.json()

        if (!name || !email || !password) {
            return Response.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
        }
        if (password.length < 6) {
            return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
        }

        const existing = await prisma.teacher.findUnique({ where: { email } })
        if (existing) {
            return Response.json({ error: 'Ya existe un profesor con ese email' }, { status: 409 })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const newRole = role === 'ADMIN' ? 'ADMIN' : 'TEACHER'

        const teacher = await prisma.teacher.create({
            data: { name, email, passwordHash, role: newRole },
            select: { id: true, name: true, email: true, createdAt: true, role: true }
        })

        return Response.json(teacher, { status: 201 })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al crear profesor' }, { status: 500 })
    }
}
