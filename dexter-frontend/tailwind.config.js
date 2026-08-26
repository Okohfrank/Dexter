/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /* ── Apple System Colors ── */
        'system-blue': '#007AFF',
        'system-green': '#34C759',
        'system-red': '#FF3B30',
        'system-orange': '#FF9500',
        'system-yellow': '#FFCC00',
        'system-purple': '#AF52DE',
        'system-pink': '#FF2D55',
        'system-teal': '#5AC8FA',
        'system-indigo': '#5856D6',

        /* ── Apple Dark Backgrounds ── */
        'apple-bg': '#000000',
        'apple-bg-primary': '#1C1C1E',
        'apple-bg-secondary': '#2C2C2E',
        'apple-bg-tertiary': '#3A3A3C',
        'apple-bg-elevated': '#1C1C1E',

        /* ── Glass Surfaces ── */
        'glass': 'rgba(255, 255, 255, 0.08)',
        'glass-light': 'rgba(255, 255, 255, 0.12)',
        'glass-heavy': 'rgba(255, 255, 255, 0.18)',
        'glass-border': 'rgba(255, 255, 255, 0.15)',
        'glass-border-light': 'rgba(255, 255, 255, 0.08)',

        /* ── Apple Typography Colors ── */
        'label-primary': '#FFFFFF',
        'label-secondary': 'rgba(235, 235, 245, 0.60)',
        'label-tertiary': 'rgba(235, 235, 245, 0.30)',
        'label-quaternary': 'rgba(235, 235, 245, 0.18)',

        /* ── Apple Separators ── */
        'separator': 'rgba(84, 84, 88, 0.65)',
        'separator-opaque': '#38383A',

        /* ── Functional ── */
        'positive': '#34C759',
        'positive-surface': 'rgba(52, 199, 89, 0.15)',
        'negative': '#FF3B30',
        'negative-surface': 'rgba(255, 59, 48, 0.15)',
        'warning': '#FF9500',
        'warning-surface': 'rgba(255, 149, 0, 0.15)',
      },
      borderRadius: {
        'apple-sm': '10px',
        'apple-md': '13px',
        'apple-lg': '16px',
        'apple-xl': '22px',
        'apple-2xl': '28px',
        'apple-3xl': '39px',
      },
      fontFamily: {
        'sf-display': ['System'],
        'sf-text': ['System'],
      },
      fontSize: {
        'apple-title1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'apple-title2': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'apple-title3': ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'apple-headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'apple-body': ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'apple-callout': ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'apple-subhead': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'apple-footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'apple-caption1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'apple-caption2': ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      spacing: {
        'apple-xs': '4px',
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '24px',
        'apple-3xl': '32px',
        'apple-4xl': '48px',
      },
    },
  },
  plugins: [],
};
