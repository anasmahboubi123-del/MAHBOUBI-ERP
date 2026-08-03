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
        primary: {
          DEFAULT: '#4A6741',
          dark: '#3d5635',
          light: '#5a7d50',
        },
        gold: {
          DEFAULT: '#C9A84C',
          dark: '#b8983d',
          light: '#d4b86a',
        },
        beige: {
          DEFAULT: '#F5ECD7',
          dark: '#e8dcc0',
          light: '#faf6ed',
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 8px 30px -4px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;