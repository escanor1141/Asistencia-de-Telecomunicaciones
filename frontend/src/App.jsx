import { BrowserRouter } from 'react-router-dom';
import EnrutadorApp from './router.jsx';
import { ProveedorAutenticacion } from './context/ContextoAutenticacion.jsx';
import { ProveedorCurso } from './context/ContextoCurso.jsx';

function App() {
    return (
        <BrowserRouter>
            <ProveedorAutenticacion>
                <ProveedorCurso>
                    <EnrutadorApp />
                </ProveedorCurso>
            </ProveedorAutenticacion>
        </BrowserRouter>
    )
}

export default App;
