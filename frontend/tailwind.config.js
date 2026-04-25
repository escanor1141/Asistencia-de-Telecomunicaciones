/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sans)'],
                mono: ['var(--font-mono)'],
            },
            colors: {
                fondo: 'var(--color-bg)',
                superficie: 'var(--color-surface)',
                borde: 'var(--color-border)',
                primario: 'var(--color-primary)',
                'primario-suave': 'var(--color-primary-light)',
                acento: 'var(--color-accent)',
                texto: 'var(--color-text-primary)',
                'texto-secundario': 'var(--color-text-secondary)',
                presente: 'var(--color-present)',
                ausente: 'var(--color-absent)',
                tardanza: 'var(--color-late)',
                justificado: 'var(--color-excused)',
                'brand-green': 'var(--color-accent)',
                'brand-blue': 'var(--color-primary)',
                'brand-purple': 'var(--color-primary)',
            },
            borderRadius: {
                tarjeta: 'var(--card-radius)',
                campo: 'var(--input-radius)',
                insignia: 'var(--badge-radius)',
            },
            spacing: {
                topbar: 'var(--topbar-height)',
                sidebar: 'var(--sidebar-width)',
            },
        },
    },
    plugins: [],
}
