import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'telecom_secret_key_2024'

export async function POST(request) {
    try {
        console.log('[Login] Intento de login recibido')
        const { email, password } = await request.json()

        if (!email || !password) {
            return Response.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
        }

        // Search for the teacher
        const teacher = await prisma.teacher.findUnique({ where: { email } })
        if (!teacher) {
            console.log(`[Login] Usuario no encontrado: ${email}`)
            return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 })
        }

        // Verify password
        const isValid = await bcrypt.compare(password, teacher.passwordHash)
        if (!isValid) {
            console.log(`[Login] Contraseña incorrecta para: ${email}`)
            return Response.json({ error: 'Credenciales incorrectas' }, { status: 401 })
        }

        // Generate token
        const token = jwt.sign(
            { id: teacher.id, email: teacher.email, name: teacher.name, role: teacher.role },
            SECRET,
            { expiresIn: '7d' }
        )

        console.log(`[Login] Login exitoso: ${email} (${teacher.role})`)
        return Response.json({ 
            token, 
            teacher: { id: teacher.id, email: teacher.email, name: teacher.name, role: teacher.role } 
        })
    } catch (error) {
        console.error('[Login Error]', error)
        return Response.json({ error: 'Error del servidor' }, { status: 500 })
    }
}
