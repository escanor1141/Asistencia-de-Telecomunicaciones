import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CourseProvider } from './context/CourseContext.jsx';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CourseProvider>
                    <AppRouter />
                </CourseProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App;
