import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F7FB",
        brand: {
          DEFAULT: "#176BFF",
          dark: "#0B4FD4",
          light: "#26C9F5",
          50: "#EEF5FF",
          100: "#DCEAFF",
          200: "#BDD6FF",
          300: "#8DBAFF",
          400: "#5795FF",
          500: "#176BFF",
          600: "#0B57E3",
          700: "#0B45B6",
        },
        ink: {
          DEFAULT: "#07182E",
          50: "#F2F5F9",
          100: "#E4EAF1",
          200: "#CBD5E1",
          300: "#A7B5C6",
          400: "#788BA2",
          500: "#52667E",
          600: "#3A4E66",
          700: "#273B53",
          800: "#142A43",
          900: "#07182E",
        },
        sun: "#F6B94A",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(7 24 46 / 0.04), 0 10px 30px rgb(7 24 46 / 0.06)",
        "card-hover": "0 24px 55px -18px rgb(7 24 46 / 0.22)",
        elevated: "0 30px 80px -30px rgb(7 24 46 / 0.38)",
        glow: "0 16px 42px -16px rgb(23 107 255 / 0.58)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
