/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#F6F7F9',
        'app-surface': '#FFFFFF',
        'app-surface-muted': '#EEF1F5',
        'app-border': '#DDE2E9',
        'app-text': '#14181F',
        'app-text-muted': '#5B6676',
        'app-primary': {
          DEFAULT: '#1D4E89',
          hover: '#163D6D',
          soft: '#E6EEF8'
        },
        'app-success': {
          DEFAULT: '#1E7F5C',
          soft: '#E4F3EC'
        },
        'app-warning': '#B26A00',
        'app-danger': '#B42318'
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      borderRadius: {
        input: '6px',
        card: '10px'
      },
      boxShadow: {
        modal: '0 8px 24px rgba(20, 24, 31, 0.12)'
      }
    },
  },
  plugins: [],
};
