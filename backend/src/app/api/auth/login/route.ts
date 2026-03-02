import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'telecom_secret_key_2024'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
        }

        const teacher = await prisma.teacher.findUnique({ where: { email } })
        if (!teacher) {
            return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
        }

        const isValid = await bcrypt.compare(password, teacher.passwordHash)
        if (!isValid) {
            return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
        }

        const token = jwt.sign(
            { id: teacher.id, email: teacher.email, name: teacher.name },
            SECRET,
            { expiresIn: '7d' }
        )

        return NextResponse.json({ token, teacher: { id: teacher.id, email: teacher.email, name: teacher.name } })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }
}
