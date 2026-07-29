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
        primary: {
          DEFAULT: '#16A34A',
          hover: '#15803d',
          light: '#dcfce7',
          dark: '#14532d',
        },
        secondary: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
          light: '#dbeafe',
          dark: '#1e3a8a',
        },
        danger: {
          DEFAULT: '#DC2626',
          hover: '#b91c1c',
          light: '#fee2e2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#d97706',
          light: '#fef3c7',
        },
        success: {
          DEFAULT: '#22C55E',
          hover: '#16a34a',
          light: '#dcfce7',
        },
        slate: {
          background: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      borderRadius: {
        'md3': '16px', // Material Design 3 rounded elements
        'md3-lg': '28px', // Large panels
      },
      boxShadow: {
        'md3-elevation-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        'md3-elevation-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
      }
    },
  },
  plugins: [],
}
