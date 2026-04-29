import { useEffect, useState } from 'react';
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
    width: '140px',
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

export default function FiltrosGlobales({ soloMateria = false }) {
    const {
        cursos,
        cursoSeleccionado,
        seleccionarCurso,
        cargandoCursos,
        codigoSeleccionado,
        setCodigoSeleccionado,
        grupoSeleccionado,
        setGrupoSeleccionado,
        docenteSeleccionado,
        setDocenteSeleccionado,
    } = useCurso();

    const [docentes, setDocentes] = useState([]);

    useEffect(() => {
        if (soloMateria) return;
        obtenerDocentes()
            .then(data => {
                console.log('DEBUG: docentes en FiltrosGlobales:', data);
                setDocentes(data);
            })
            .catch(() => setDocentes([]));
    }, [soloMateria]);

    const codigosUnicos = cursoSeleccionado
        ? [...new Set(
            cursos
                .filter((c) => c.name === cursoSeleccionado.name)
                .map((c) => c.code)
                .filter(Boolean)
          )]
        : [];

    const gruposUnicos = cursoSeleccionado
        ? [...new Set(
            cursos
                .filter((c) => c.name === cursoSeleccionado.name)
                .map((c) => c.groupCode)
                .filter(Boolean)
          )]
        : [];

    const idsCursosFiltrados = cursoSeleccionado
        ? cursos
            .filter((c) => c.name === cursoSeleccionado.name)
            .map((c) => c.teacherId)
            .filter(Boolean)
        : [];

    const docentesFiltrados = docentes.filter((d) =>
        idsCursosFiltrados.includes(d.id)
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {cargandoCursos ? (
                <span style={{ ...estiloLabel, color: 'var(--color-muted)' }}>Cargando...</span>
            ) : cursos?.length > 0 ? (
                <SelectorFiltro
                    label="Materia activa:"
                    id="selector-materia"
                    value={cursoSeleccionado?.id ?? ''}
                    onChange={(e) => {
                        const c = cursos.find((curso) => curso.id === e.target.value);
                        if (c) seleccionarCurso(c);
                    }}
                >
                    {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>{curso.name}</option>
                    ))}
                </SelectorFiltro>
            ) : (
                <span style={{ ...estiloLabel, fontStyle: 'italic' }}>Sin materias</span>
            )}

            {!soloMateria && cursoSeleccionado && (
                <>
                    <SelectorFiltro
                        label="Código:"
                        id="selector-codigo"
                        value={codigoSeleccionado ?? ''}
                        onChange={(e) => setCodigoSeleccionado(e.target.value || null)}
                    >
                        <option value="">Todos</option>
                        {codigosUnicos.map((cod) => <option key={cod} value={cod}>{cod}</option>)}
                    </SelectorFiltro>

                    <SelectorFiltro
                        label="Grupo:"
                        id="selector-grupo"
                        value={grupoSeleccionado ?? ''}
                        onChange={(e) => setGrupoSeleccionado(e.target.value || null)}
                    >
                        <option value="">Todos</option>
                        {gruposUnicos.map((g) => <option key={g} value={g}>{g}</option>)}
                    </SelectorFiltro>

                    <SelectorFiltro
                        label="Docente:"
                        id="selector-docente"
                        value={docenteSeleccionado ?? ''}
                        onChange={(e) => setDocenteSeleccionado(e.target.value || null)}
                    >
                        <option value="">Todos</option>
                        {docentesFiltrados.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </SelectorFiltro>
                </>
            )}
        </div>
    );
}
