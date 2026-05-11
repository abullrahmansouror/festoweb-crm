import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#121212',
        surface: '#1a1a1a',
        surface2: '#222222',
        border: '#2a2a2a',
        primary: '#6366f1',
        'primary-hover': '#4f46e5',
        accent: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        'text-primary': '#f1f1f1',
        'text-muted': '#a0a0a0',
        'text-faint': '#555555',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
