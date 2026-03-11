import { createContext, useState, useEffect, useContext } from 'react';
import { getCourses } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CourseContext = createContext(null);

export const CourseProvider = ({ children }) => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loadingCourses, setLoadingCourses] = useState(true);

    const loadCourses = async () => {
        if (!user) return;
        setLoadingCourses(true);
        try {
            const data = await getCourses();
            setCourses(data);
            if (data.length > 0 && !selectedCourse) {
                // Keep previously stored selection if valid, else first
                const savedCourseId = localStorage.getItem('selectedCourseId');
                const found = data.find(c => c.id === savedCourseId);
                if (found) {
                    setSelectedCourse(found);
                } else {
                    setSelectedCourse(data[0]);
                    localStorage.setItem('selectedCourseId', data[0].id);
                }
            } else if (data.length === 0) {
                setSelectedCourse(null);
                localStorage.removeItem('selectedCourseId');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar cursos');
        } finally {
            setLoadingCourses(false);
        }
    };

    useEffect(() => {
        loadCourses();
        // eslint-disable-next-line
    }, [user]);

    const selectCourse = (course) => {
        if (!course) return;
        setSelectedCourse(course);
        localStorage.setItem('selectedCourseId', course.id);
    };

    return (
        <CourseContext.Provider value={{ courses, selectedCourse, selectCourse, loadCourses, loadingCourses }}>
            {children}
        </CourseContext.Provider>
    );
};

export const useCourse = () => useContext(CourseContext);
