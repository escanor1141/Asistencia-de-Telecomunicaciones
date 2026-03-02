import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
        <Toaster position="top-right" toastOptions={{
            className: 'font-semibold tracking-wide rounded-xl shadow-lg',
            success: {
                iconTheme: { primary: '#10b981', secondary: 'white' },
            },
        }} />
    </React.StrictMode>,
)
