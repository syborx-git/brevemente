/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inclusive Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        clinical: {
          dark: '#304768',      // Azul Neural (Sidebar y cabeceras)
          darkLight: '#435a7d', // Hover Azul Neural
          accent: '#75AFBC',    // Azul Conciencia (Acciones clínicas, Brifi, calendarios)
          accentHover: '#6099a5',
          teal: '#0d9488',      // Semántico Éxito / Clínico
          tealHover: '#0f766e',
          orange: '#ea580c',    // Semántico Advertencia
          bg: '#F4F4F4',        // Gris Digital (Fondo de áreas)
          card: '#ffffff',      // Blanco (Superficies principales)
          border: '#e2e8f0',    // Bordes suaves
          textDark: '#304768',  // Texto oscuro principal (Azul Neural)
          textMuted: '#64748b', // Texto secundario
          risk: '#ef4444'       // Rojo Semántico para riesgo/alertas
        }
      }
    },
  },
  plugins: [],
}
