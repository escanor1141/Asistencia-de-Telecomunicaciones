/**
 * dateUtils.js
 * Utilidades centralizadas para manejo de fechas en formato YYYY-MM-DD
 * usando siempre la zona horaria de Colombia (America/Bogota).
 */

/**
 * Formatea una fecha (Date o string) a YYYY-MM-DD en hora de Colombia.
 */
export const fmtBogota = (d = new Date()) => {
    const date = d instanceof Date ? d : new Date(d);
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);
};

/**
 * Devuelve el lunes de la semana que contiene la fecha dada.
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD
 */
export const getLunesSemana = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + diff);
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dy}`;
};

/**
 * Obtiene el rango Lunes-Sábado de la semana actual.
 */
export const getCurrentWeekRange = (referenceDate = new Date()) => {
    const hoyStr = fmtBogota(referenceDate);
    const lunesStr = getLunesSemana(hoyStr);
    
    const [y, m, d] = lunesStr.split('-').map(Number);
    const lunes = new Date(y, m - 1, d);
    
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    
    return {
        weekStart: lunesStr,
        weekEnd: fmtBogota(sabado)
    };
};

/**
 * Obtiene el rango Lunes-Sábado de la semana ANTERIOR.
 * Cuando el cron corre el domingo, esta función retorna la semana que acaba de terminar.
 */
export const getPreviousWeekRange = (referenceDate = new Date()) => {
    const hoyStr = fmtBogota(referenceDate);
    const lunesActualStr = getLunesSemana(hoyStr);

    const [y, m, d] = lunesActualStr.split('-').map(Number);
    const lunesActual = new Date(y, m - 1, d);

    // Retroceder 7 días al lunes anterior
    const lunesAnterior = new Date(lunesActual);
    lunesAnterior.setDate(lunesActual.getDate() - 7);

    const sabadoAnterior = new Date(lunesAnterior);
    sabadoAnterior.setDate(lunesAnterior.getDate() + 5);

    return {
        weekStart: fmtBogota(lunesAnterior),
        weekEnd:   fmtBogota(sabadoAnterior),
    };
};
