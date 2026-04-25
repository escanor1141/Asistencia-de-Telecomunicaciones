import jwt from 'jsonwebtoken'

// Clave secreta para firmar y verificar tokens JWT
const SECRETO = process.env.JWT_SECRET || 'telecom_secret_key_2024'

/**
 * Extrae y verifica el usuario desde el encabezado Authorization de la petición.
 * Retorna los datos del token o null si es inválido / ausente.
 */
export function obtenerUsuarioDePeticion(request) {
    const encabezadoAuth = request.headers.get('authorization')
    if (!encabezadoAuth || !encabezadoAuth.startsWith('Bearer ')) return null
    try {
        const token = encabezadoAuth.split(' ')[1]
        return jwt.verify(token, SECRETO) // { id, email, name, ... } — id es el teacherId
    } catch (e) {
        return null
    }
}
