/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fresh & Clean theme — SocietyBasket
        // Warm off-white background, lime accents, forest-green text.
        // Token names preserved (neon-*) so existing components retheme
        // without touching every file.
        neon: {
          black: '#F8F8F1', // main page background (warm off-white)
          cherry: '#FFFFFF', // surface / panel / header background
          spring: '#D9F66F', // primary accent (fresh lime)
          green: '#007A1F', // secondary accent (green)
          dark: '#E4E5D9', // borders / dividers
          // softer readable variants
          springDim: '#C8E85A', // slightly deeper lime for hover
          greenDim: '#006A1A', // deeper green
          ink: '#203D24', // primary text (forest green)
          ash: '#71806E', // secondary text (muted sage-grey)
          smoke: '#E4E5D9', // borders / dividers
          panel: '#FFFFFF', // card surface (white)
          panelAlt: '#F8F8F1', // slightly off-white panel
          soft: '#EAF4D8', // soft section background
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(32,61,36,0.06), 0 2px 8px rgba(32,61,36,0.04)',
        soft: '0 1px 4px rgba(32,61,36,0.05)',
        pop: '0 8px 30px rgba(32,61,36,0.10)',
        glow: '0 1px 3px rgba(217,246,111,0.30)',
        glowSoft: '0 1px 3px rgba(217,246,111,0.20)',
        glowStrong: '0 2px 6px rgba(217,246,111,0.35)',
        innerGlow: 'inset 0 0 20px rgba(234,244,216,0.5)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 1px 3px rgba(217,246,111,0.20)' },
          '50%': { boxShadow: '0 2px 6px rgba(217,246,111,0.30)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out both',
        pulseSoft: 'pulseSoft 1.2s ease-in-out infinite',
        floatIn: 'floatIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
        glowPulse: 'glowPulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
