import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        elevated: '#1e1e1e',
        border: '#2a2a2a',
        primary: '#1DB954',
        'primary-hover': '#1ed760',
        secondary: '#a3a3a3',
        muted: '#525252',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
