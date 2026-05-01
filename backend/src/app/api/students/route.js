import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function limpiarTexto(valor) {
    if (valor === null || valor === undefined) return null
    const texto = String(valor).trim()
    return texto === '' ? null : texto
}

// GET — obtener lista de estudiantes de un curso con filtros opcionales
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const idCurso   = searchParams.get('courseId')
        const codigo    = searchParams.get('codigo')    || null
        const grupo     = searchParams.get('grupo')     || null
        const docenteId = searchParams.get('docenteId') || null

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        // Condición WHERE base sobre Student
        const where = { courseId: idCurso }

        // Filtros adicionales a través de la relación Course
        const filtroCurso = {}
        if (codigo)    filtroCurso.code      = codigo
        if (grupo)     filtroCurso.groupCode = grupo
        if (docenteId) filtroCurso.teacherId = docenteId

        if (Object.keys(filtroCurso).length > 0) {
            where.course = filtroCurso
        }

        const estudiantes = await prisma.student.findMany({
            where,
            orderBy: { name: 'asc' }
        })
        return Response.json(estudiantes.map((estudiante) => ({
            ...estudiante,
            id: estudiante.documento,
        })))
    } catch (error) {
        return Response.json({ error: 'Error al obtener estudiantes' }, { status: 500 })
    }
}

// POST — crear uno o múltiples estudiantes (importación CSV)
export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url)
        const idCurso = searchParams.get('courseId')

        if (!idCurso) {
            return Response.json({ error: 'courseId es requerido' }, { status: 400 })
        }

        const cuerpo = await request.json()
        // Soporte para inserción individual o masiva (CSV)
        if (Array.isArray(cuerpo)) {
            const datos = cuerpo
                .filter((e) => limpiarTexto(e.name) && limpiarTexto(e.documento))
                .map((e) => ({
                    documento: limpiarTexto(e.documento),
                    name: limpiarTexto(e.name),
                    email: limpiarTexto(e.email),
                    whatsapp: limpiarTexto(e.whatsapp),
                    courseId: idCurso,
                }))

            const creados = await prisma.student.createMany({
                data: datos,
                skipDuplicates: true,
            })
            return Response.json({ count: creados.count }, { status: 201 })
        }

        const { documento, name, email, whatsapp } = cuerpo
        const documentoLimpio = limpiarTexto(documento)
        const nombreLimpio = limpiarTexto(name)
        if (!documentoLimpio) {
            return Response.json({ error: 'El documento es requerido' }, { status: 400 })
        }
        if (!nombreLimpio) {
            return Response.json({ error: 'El nombre es requerido' }, { status: 400 })
        }

        const estudiante = await prisma.student.create({
            data: {
                documento: documentoLimpio,
                name: nombreLimpio,
                email: limpiarTexto(email),
                whatsapp: limpiarTexto(whatsapp),
                courseId: idCurso,
            }
        })
        return Response.json({ ...estudiante, id: estudiante.documento }, { status: 201 })
    } catch (error) {
        console.error(error)
        return Response.json({ error: 'Error al crear estudiante' }, { status: 500 })
    }
}
