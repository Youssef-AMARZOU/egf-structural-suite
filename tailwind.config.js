/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        cat: {
          poteaux: '#4C8DFF',
          dalles: '#2DD4BF',
          poutres: '#A78BFA',
          fondations: '#F5A524',
        },
        status: {
          pass: '#34D399',
          fail: '#F87171',
          warn: '#FBBF24',
        },
        ink: {
          primary: '#F1F4FA',
          secondary: '#93A0B8',
        },
      },
      boxShadow: {
        glass: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-pass': '0 0 18px #34D39933',
        'glow-fail': '0 0 18px #F8717133',
        'glow-warn': '0 0 18px #FBBF2433',
      },
    },
  },
  plugins: [],
};
