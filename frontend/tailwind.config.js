/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elan: {
          950: '#0E1D21', // Deepest midnight teal base (swatch 5)
          900: '#122E34', // Dark surgical slate cards (swatch 4)
          850: '#183840', // Elevated surfaces / hover states
          800: '#244C56', // Muted slate teal borders & dividers (swatch 3)
          700: '#336572', // Active borders & subtle focus
          600: '#3B7E8C', // Primary clinical accent & interactive buttons
          500: '#4B92A1', // Hover state for primary buttons
          400: '#677E8A', // Muted steel blue / secondary text (swatch 2)
          300: '#8A9CA6', // Soft secondary text
          200: '#ABAFB5', // Surgical silver / primary body text (swatch 1)
          100: '#D5DAE0', // High-contrast subheadings
          50:  '#F1F5F9', // Crisp white/ice headings
        }
      }
    },
  },
  plugins: [],
}
