import { createContext, useState, useEffect, useContext } from 'react';
import { obtenerCursos } from '../services/api';
import { useAutenticacion } from './ContextoAutenticacion';
import toast from 'react-hot-toast';

// Contexto de cursos activos del docente
const ContextoCurso = createContext(null);

export const ProveedorCurso = ({ children }) => {
    const { usuario } = useAutenticacion();
    const [cursos, setCursos] = useState([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [cargandoCursos, setCargandoCursos] = useState(true);

    const cargarCursos = async () => {
        if (!usuario) return;
        setCargandoCursos(true);
        try {
            const datos = await obtenerCursos();
            setCursos(datos);
            if (datos.length > 0 && !cursoSeleccionado) {
                // Mantener la selección guardada si aún es válida, si no usar el primero
                const idCursoGuardado = localStorage.getItem('selectedCourseId');
                const encontrado = datos.find(c => c.id === idCursoGuardado);
                if (encontrado) {
                    setCursoSeleccionado(encontrado);
                } else {
                    setCursoSeleccionado(datos[0]);
                    localStorage.setItem('selectedCourseId', datos[0].id);
                }
            } else if (datos.length === 0) {
                setCursoSeleccionado(null);
                localStorage.removeItem('selectedCourseId');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar cursos');
        } finally {
            setCargandoCursos(false);
        }
    };

    useEffect(() => {
        cargarCursos();
        // eslint-disable-next-line
    }, [usuario]);

    const seleccionarCurso = (curso) => {
        if (!curso) return;
        setCursoSeleccionado(curso);
        localStorage.setItem('selectedCourseId', curso.id);
    };

    return (
        <ContextoCurso.Provider value={{ cursos, cursoSeleccionado, seleccionarCurso, cargarCursos, cargandoCursos }}>
            {children}
        </ContextoCurso.Provider>
    );
};

export const useCurso = () => useContext(ContextoCurso);
