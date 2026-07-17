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
        canvas: "#F6F8F7",
        brand: {
          DEFAULT: "#0F9F6E",
          dark: "#087A54",
          light: "#2CCB92",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        ink: {
          DEFAULT: "#10261F",
          50: "#F3F6F5",
          100: "#E5EBE8",
          200: "#CDD8D3",
          300: "#A8BBB2",
          400: "#789087",
          500: "#526B62",
          600: "#3C524A",
          700: "#2B3F38",
          800: "#1B3029",
          900: "#10261F",
        },
        sun: "#F6B94A",
      },
      fontFamily: {
        sans: ["Manrope", "Avenir Next", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 38 31 / 0.04), 0 8px 24px rgb(16 38 31 / 0.05)",
        "card-hover": "0 20px 45px -16px rgb(16 38 31 / 0.18)",
        elevated: "0 24px 70px -28px rgb(16 38 31 / 0.32)",
        glow: "0 12px 38px -12px rgb(15 159 110 / 0.52)",
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
