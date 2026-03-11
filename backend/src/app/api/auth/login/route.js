import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'telecom_secret_key_2024'

export async function POST(request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return Response.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
        }

        const teacher = await prisma.teacher.findUnique({ where: { email } })
        if (!teacher) {
            return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 })
        }

        const isValid = await bcrypt.compare(password, teacher.passwordHash)
        if (!isValid) {
            return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 })
        }

        const token = jwt.sign(
            { id: teacher.id, email: teacher.email, name: teacher.name, role: teacher.role },
            SECRET,
            { expiresIn: '7d' }
        )

        return Response.json({ token, teacher: { id: teacher.id, email: teacher.email, name: teacher.name, role: teacher.role } })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error del servidor' }, { status: 500 })
    }
}
