import { useEffect, useMemo } from 'react';
import { useCurso } from '../context/ContextoCurso';
import { obtenerDocentes } from '../services/api';

const estiloSelector = {
    height: '36px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--input-radius)',
    padding: '0 28px 0 10px',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: '500',
    color: 'var(--color-text-primary)',
    background: 'var(--color-surface)',
    appearance: 'none',
    cursor: 'pointer',
    transition: 'border-color var(--transition-fast)',
    outline: 'none',
    minWidth: '140px',
    maxWidth: '400px',
    width: 'auto',
    textOverflow: 'ellipsis',
};

const estiloLabel = {
    fontSize: '0.8125rem',
    fontWeight: '500',
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
};

function ChevronAbajo() {
    return (
        <svg
            style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--color-muted)',
            }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function SelectorFiltro({ label, id, value, onChange, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor={id} style={estiloLabel}>
                {label}
            </label>
            <div style={{ position: 'relative' }}>
                <select
                    id={id}
                    value={value ?? ''}
                    onChange={onChange}
                    style={estiloSelector}
                    onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-primary)';
                        e.target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent)';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = 'var(--color-border)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    {children}
                </select>
                <ChevronAbajo />
            </div>
        </div>
    );
}

export default function FiltrosGlobales({ soloMateria = false, filtroDia = null }) {
    const {
        cursos,
        cursoSeleccionado,
        seleccionarCurso,
        cargandoCursos,
        grupoSeleccionado,
        setGrupoSeleccionado,
    } = useCurso();

    // 1. Filtrar por día si aplica
    const cursosFiltrados = useMemo(() => {
        if (!filtroDia) return cursos;
        return cursos.filter(c => c.dia === filtroDia || c.dia2 === filtroDia);
    }, [cursos, filtroDia]);

    // 2. Nombres únicos de materias (sin duplicados por grupo)
    const nombresUnicos = useMemo(() => {
        const vistos = new Set();
        return cursosFiltrados.filter(c => {
            if (vistos.has(c.name)) return false;
            vistos.add(c.name);
            return true;
        });
    }, [cursosFiltrados]);

    // 3. Grupos disponibles para la materia seleccionada (todos los cursos con ese nombre y día)
    const gruposDisponibles = useMemo(() => {
        if (!cursoSeleccionado) return [];
        return cursosFiltrados
            .filter(c => c.name === cursoSeleccionado.name)
            .filter(c => c.groupCode)
            .sort((a, b) => a.groupCode.localeCompare(b.groupCode));
    }, [cursosFiltrados, cursoSeleccionado]);

    // 4. Cuando cambia el filtroDia, autoseleccionar primer curso válido
    useEffect(() => {
        if (filtroDia && cursosFiltrados.length > 0) {
            const isSelectedValid = cursosFiltrados.some(c => c.id === cursoSeleccionado?.id);
            if (!isSelectedValid) {
                seleccionarCurso(cursosFiltrados[0]);
            }
        }
    }, [filtroDia, cursosFiltrados, cursoSeleccionado?.id, seleccionarCurso]);

    // 5. Cuando cambian los grupos disponibles, sincronizar grupoSeleccionado
    const gruposDisponiblesKey = gruposDisponibles.map(g => g.groupCode).join(',');
    useEffect(() => {
        if (gruposDisponibles.length === 0) {
            setGrupoSeleccionado(null);
            return;
        }
        const existe = gruposDisponibles.some(g => g.groupCode === grupoSeleccionado);
        if (!existe) {
            // Autoseleccionar el primer grupo y actualizar el curso seleccionado
            const primerGrupo = gruposDisponibles[0];
            setGrupoSeleccionado(primerGrupo.groupCode);
            seleccionarCurso(primerGrupo);
        }
    }, [gruposDisponiblesKey, setGrupoSeleccionado, seleccionarCurso]);

    const handleCambioMateria = (e) => {
        // Al elegir una materia, seleccionar el primer curso de ese nombre (primer grupo)
        const primerCurso = cursosFiltrados.find(c => c.name === e.target.value);
        if (primerCurso) {
            seleccionarCurso(primerCurso);
            setGrupoSeleccionado(primerCurso.groupCode);
        }
    };

    const handleCambioGrupo = (e) => {
        // Al elegir un grupo, actualizar tanto el grupo como el curso activo
        const cursoDelGrupo = gruposDisponibles.find(c => c.groupCode === e.target.value);
        if (cursoDelGrupo) {
            seleccionarCurso(cursoDelGrupo); // Cambia el ID del curso activo al correcto
            setGrupoSeleccionado(cursoDelGrupo.groupCode);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {cargandoCursos ? (
                <span style={{ ...estiloLabel, color: 'var(--color-muted)' }}>Cargando...</span>
            ) : nombresUnicos?.length > 0 ? (
                <SelectorFiltro
                    label="Materia activa:"
                    id="selector-materia"
                    value={cursoSeleccionado?.name ?? ''}
                    onChange={handleCambioMateria}
                >
                    {nombresUnicos.map((curso) => (
                        <option key={curso.id} value={curso.name}>{curso.name}</option>
                    ))}
                </SelectorFiltro>
            ) : (
                <span style={{ ...estiloLabel, fontStyle: 'italic' }}>Sin materias para este día</span>
            )}

            {!soloMateria && cursoSeleccionado && gruposDisponibles.length > 0 && (
                <>
                    <SelectorFiltro
                        label="Grupo:"
                        id="selector-grupo"
                        value={grupoSeleccionado ?? ''}
                        onChange={handleCambioGrupo}
                    >
                        {gruposDisponibles.map((c) => (
                            <option key={c.id} value={c.groupCode}>{c.groupCode}</option>
                        ))}
                    </SelectorFiltro>
                </>
            )}
        </div>
    );
}
