/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          green: '#1a4d2e',
          line: '#ffffff',
          dark: '#0a1f1a',
        },
        sports: {
          primary: '#00ff88',
          secondary: '#00d4ff',
          accent: '#ff3366',
          dark: '#0f1419',
          darker: '#0a0e13',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
