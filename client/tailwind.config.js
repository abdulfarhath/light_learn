/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                'primary-dark': 'var(--color-primary-dark)',
                accent: 'var(--color-accent)',
                'bg-dark': 'var(--color-bg-dark)',
                'bg-panel': 'var(--color-bg-panel)',
                'bg-hover': 'var(--color-bg-hover)',
                'text-main': 'var(--color-text-main)',
                'text-muted': 'var(--color-text-muted)',
                border: 'var(--color-border)',
                success: 'var(--color-success)',
                danger: 'var(--color-danger)',
                warning: 'var(--color-warning)',
            },
        },
    },
    plugins: [],
}
