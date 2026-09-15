/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0E14",
        surface: {
          DEFAULT: "#121722",
          hover: "#1A2234",
          border: "#262F45",
        },
        brand: {
          red: "#FF2E4C",
          "red-dark": "#D61F3B",
          gold: "#FF9F1C",
          orange: "#FF5722",
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(255, 46, 76, 0.25)',
        'glow-gold': '0 0 20px rgba(255, 159, 28, 0.25)',
      }
    },
  },
  plugins: [],
};
