/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            50: '#f2f9f4',
            100: '#e1f2e6',
            200: '#c3e5cd',
            300: '#97d2a7',
            400: '#5eba7a',
            500: '#2ea355',
            600: '#1e8240',
            700: '#176b39',
            800: '#14552f',
            900: '#114627',
            950: '#072714',
          },
          orange: {
            50: '#fff8f1',
            100: '#feeddc',
            200: '#fdd9b8',
            300: '#fbbf89',
            400: '#f79950',
            500: '#f47a24',
            600: '#e05f12',
            700: '#ba470e',
            800: '#943813',
            900: '#7a3013',
          },
          neutral: {
            50: '#fafbf8',
            100: '#f3f5ef',
            200: '#e5e8de',
            300: '#d0d6c5',
            400: '#a0a894',
            500: '#717b67',
            600: '#555e4d',
            700: '#3f4638',
            800: '#2b3026',
            900: '#1d211a',
            950: '#17251c',
          },
          // Legacy alias support for existing components
          50: '#f2f9f4',
          100: '#e1f2e6',
          500: '#2ea355',
          600: '#1e8240',
          700: '#176b39',
          800: '#14552f',
          900: '#114627',
        },
      },
      fontFamily: {
        sans: ['IRANSans', 'Vazirmatn', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 37, 28, 0.04), 0 1px 2px -1px rgba(23, 37, 28, 0.04)',
        'card': '0 2px 8px -2px rgba(23, 37, 28, 0.06), 0 1px 4px -1px rgba(23, 37, 28, 0.04)',
        'float': '0 12px 32px -4px rgba(23, 37, 28, 0.12), 0 4px 12px -2px rgba(23, 37, 28, 0.06)',
      },
    },
  },
  plugins: [],
};
