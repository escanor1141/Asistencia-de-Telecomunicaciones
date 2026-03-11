import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'telecom_secret_key_2024'

export function getUserFromRequest(request) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    try {
        const token = authHeader.split(' ')[1]
        return jwt.verify(token, SECRET) // { id, email, name, ... } - id is teacherId
    } catch (e) {
        return null
    }
}
