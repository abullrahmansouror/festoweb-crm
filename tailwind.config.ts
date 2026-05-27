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
        bg:       '#07090e',
        surface:  '#0d1117',
        surface2: '#131820',
        surface3: '#1a2030',
        primary:  '#7c6ff7',
        'primary-light': '#a89ff9',
        accent:   '#06d6a0',
        warning:  '#fbbf24',
        danger:   '#ff6b6b',
        info:     '#60a5fa',
        special:  '#f472b6',
        text: {
          1: '#eef2ff',
          2: '#94a3b8',
          3: '#64748b',
          4: '#334155',
        },
      },
      fontFamily: {
        sans:    ['var(--font-body)',    'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
