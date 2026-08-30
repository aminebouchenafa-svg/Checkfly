import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#2957d1',
          600: '#1f43a8',
          700: '#193687'
        }
      }
    }
  },
  plugins: []
};

export default config;
