import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'telecom_secret_key_2024'

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, SECRET) as { id: string; email: string; name: string }

        return NextResponse.json({ id: decoded.id, email: decoded.email, name: decoded.name })
    } catch (error) {
        return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }
}
