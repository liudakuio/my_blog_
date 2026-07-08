/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"OPPO Sans"', 'Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        primary: '#000000',
        secondary: '#666666',
        bg: '#ffffff',
        line: '#e5e5e5',
      },
      boxShadow: {
        'pill': '0 4px 20px rgba(0,0,0,0.05)',
        'pill-dark': '0 4px 20px rgba(255,255,255,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'liquid': 'liquid 3s ease infinite',
        'message-pop': 'messagePop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'message-pop-out': 'messagePopOut 0.3s ease-in forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        liquid: {
          '0%': { 'background-size': '200% 200%', 'background-position': '0% 50%' },
          '50%': { 'background-size': '200% 200%', 'background-position': '100% 50%' },
          '100%': { 'background-size': '200% 200%', 'background-position': '0% 50%' },
        },
        messagePop: {
          '0%': {
              opacity: '0',
              transform: 'translateY(-10px) rotateX(-16deg) scale(0.92)',
              filter: 'blur(32px) brightness(0.1)'
          },
          '100%': {
              opacity: '1',
              transform: 'translateY(0) rotateX(0deg) scale(1)',
              filter: 'blur(0px) brightness(1)'
          }
        },
        messagePopOut: {
          '0%': {
              opacity: '1',
              transform: 'translateY(0) rotateX(0deg) scale(1)',
              filter: 'blur(0px) brightness(1)'
          },
          '100%': {
              opacity: '0',
              transform: 'translateY(-10px) rotateX(-16deg) scale(0.92)',
              filter: 'blur(32px) brightness(0.1)'
          }
        }
      }
    }
  },
  plugins: [],
}