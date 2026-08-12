import { colors } from './src/theme/colors.js';
import { spacing } from './src/theme/spacing.js';
import { fontSize } from './src/theme/fontSize.js';
import { fontWeight } from './src/theme/fontWeight.js';
import { borderRadius } from './src/theme/borderRadius.js';
import { boxShadow } from './src/theme/boxShadow.js';
import { breakpoints } from './src/theme/breakpoints.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors,
      spacing,
      fontSize,
      fontWeight,
      borderRadius,
      boxShadow,
      screens: breakpoints,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
