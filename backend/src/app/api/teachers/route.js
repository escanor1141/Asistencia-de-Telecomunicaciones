import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { obtenerUsuarioDePeticion } from '@/lib/auth'

// GET — listar todos los profesores (solo ADMIN)
export async function GET(request) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario || usuario.role !== 'ADMIN') {
            return Response.json({ error: 'No autorizado' }, { status: 403 })
        }

        const profesores = await prisma.teacher.findMany({
            select: { id: true, name: true, email: true, createdAt: true, role: true },
            orderBy: { createdAt: 'asc' }
        })
        return Response.json(profesores)
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al obtener profesores' }, { status: 500 })
    }
}

// POST — crear un profesor (solo ADMIN)
export async function POST(request) {
    try {
        const usuario = obtenerUsuarioDePeticion(request)
        if (!usuario || usuario.role !== 'ADMIN') {
            return Response.json({ error: 'No autorizado' }, { status: 403 })
        }

        const { name, email, password, role } = await request.json()

        if (!name || !email || !password) {
            return Response.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
        }
        if (password.length < 6) {
            return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
        }

        const existente = await prisma.teacher.findUnique({ where: { email } })
        if (existente) {
            return Response.json({ error: 'Ya existe un profesor con ese email' }, { status: 409 })
        }

        const hashContrasena = await bcrypt.hash(password, 10)
        const rolFinal = role === 'ADMIN' ? 'ADMIN' : 'TEACHER'

        const profesor = await prisma.teacher.create({
            data: { name, email, passwordHash: hashContrasena, role: rolFinal },
            select: { id: true, name: true, email: true, createdAt: true, role: true }
        })

        return Response.json(profesor, { status: 201 })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al crear profesor' }, { status: 500 })
    }
}
