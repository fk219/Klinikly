/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F2F4F0',
        stone: '#E6EBE4',
        ink: '#10201C',
        pine: '#1F4D43',
        sage: '#DCE5DD',
        coral: '#C26A4A',
        muted: 'rgba(16,32,28,0.62)',
        line: 'rgba(16,32,28,0.14)',
      },
      fontFamily: {
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
