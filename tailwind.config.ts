import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-bg', 'bg-surface', 'bg-surface2',
    'text-text-primary', 'text-text-muted', 'text-text-faint',
    'border-border',
    'hover:bg-surface2', 'hover:text-text-primary',
    'bg-primary/10', 'bg-accent/10', 'bg-red-400/10', 'bg-amber-400/10',
    'bg-blue-400/10', 'bg-purple-400/10', 'bg-primary/10',
    'text-primary', 'text-accent',
  ],
  theme: {
    extend: {
      colors: {
        bg:        '#121212',
        surface:   '#1a1a1a',
        surface2:  '#222222',
        border:    '#2a2a2a',
        primary:        '#6366f1',
        'primary-hover':'#4f46e5',
        accent:    '#10b981',
        warning:   '#f59e0b',
        error:     '#ef4444',
        text: {
          primary: '#f1f1f1',
          muted:   '#a0a0a0',
          faint:   '#555555',
        },
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
