import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#fdf8f0', 100: '#f7ead2', 500: '#b8860b', 600: '#9a6f09', 700: '#7c5807' }
      }
    }
  },
  plugins: []
};
export default config;
