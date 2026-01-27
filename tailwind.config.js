/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vega цветовая палитра
        primary: {
          50: '#f0f7f4',
          100: '#d9e8e0',
          200: '#b3d1c1',
          300: '#8dbaa2',
          400: '#67a383',
          500: '#2B4A39', // Основной зеленый
          600: '#223b2e',
          700: '#1a2d23',
          800: '#111e18',
          900: '#090f0d',
        },
        secondary: {
          DEFAULT: '#BCCEA9', // Sage зеленый
          50: '#f5f7f2',
          100: '#e8ede0',
          200: '#d1dbc1',
          300: '#BCCEA9',
          400: '#a5b88a',
          500: '#8fa26b',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        // Vega специфичные цвета
        vega: {
          white: '#FFFFFF',
          sage: '#BCCEA9',
          'dark-green': '#2B4A39',
          charcoal: '#2D2E30',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-out-right': 'slideOutRight 0.3s ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
