/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0b1120',
          850: '#0f172a',
          800: '#141e33',
          750: '#1a2742',
          700: '#1e293b',
          600: '#334155',
        },
        shield: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          electric: '#00e5ff',
          neon: '#38bdf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          critical: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.3)',
        'glow-blue': '0 0 20px -5px rgba(59, 130, 246, 0.3)',
        'glow-danger': '0 0 20px -5px rgba(239, 68, 68, 0.3)',
        'card': '0 4px 20px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
