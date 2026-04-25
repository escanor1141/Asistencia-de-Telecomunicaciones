import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
        <Toaster position="top-right" toastOptions={{
            className: 'font-semibold tracking-wide rounded-xl shadow-sm',
            success: {
                iconTheme: { primary: 'var(--color-accent)', secondary: 'var(--color-surface)' },
            },
        }} />
    </React.StrictMode>,
)
