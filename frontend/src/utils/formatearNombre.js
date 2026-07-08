/**
 * formatearNombre.js
 *
 * Convierte un nombre completo almacenado en el formato:
 *   "Nombres... Apellido1 Apellido2"
 * al formato de visualización/orden:
 *   "Apellido1 Apellido2, Nombres..."
 *
 * Regla: los 2 últimos tokens son los apellidos, el resto son los nombres.
 * Si el nombre tiene solo 1 token se devuelve tal cual.
 * Si tiene 2 tokens se tratan como "Apellido Nombre" → "Apellido, Nombre".
 * Si tiene 3+ tokens → últimos 2 = apellidos, resto = nombres.
 *
 * @param {string} nombre - Nombre completo en el orden nombre → apellidos
 * @returns {string}      - "Apellido1 Apellido2, Nombres"
 */
export function formatearNombre(nombre = '') {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length <= 1) return nombre;
    if (partes.length === 2) return `${partes[1]}, ${partes[0]}`;

    const apellidos = partes.slice(-2).join(' ');
    const nombres   = partes.slice(0, -2).join(' ');
    return `${apellidos}, ${nombres}`;
}

/**
 * Extrae la clave de ordenamiento: el penúltimo token (primer apellido).
 * @param {string} nombre
 * @returns {string}
 */
export function claveOrdenNombre(nombre = '') {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length < 2) return nombre.toLowerCase();
    return partes[partes.length - 2].toLowerCase();
}

/**
 * Comparador para Array.sort() que ordena por primer apellido.
 * @param {string} a - nombre completo
 * @param {string} b - nombre completo
 */
export function compararPorApellido(a, b) {
    return claveOrdenNombre(a).localeCompare(claveOrdenNombre(b), 'es', { sensitivity: 'base' });
}
