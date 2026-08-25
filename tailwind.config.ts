import type { Config } from "tailwindcss";

const greenShades = {
  50: "#EFF7EF",
  100: "#D9EDD9",
  200: "#B5DDB5",
  300: "#8ACB8A",
  400: "#57B057",
  500: "#2E9E2E",
  600: "#228B22",
  700: "#1B6E1B",
  800: "#145214",
  900: "#0F4210",
};

const deepShades = {
  50: "#EBF5ED",
  100: "#CFE7D4",
  200: "#A3D2AE",
  300: "#70B782",
  400: "#3E9C5C",
  500: "#117A38",
  600: "#00501F",
  700: "#00441B",
  800: "#003616",
  900: "#00250F",
};

const successShades = {
  50: "#F0FDF4",
  100: "#DCFCE7",
  200: "#BBF7D0",
  300: "#86EFAC",
  400: "#4ADE80",
  DEFAULT: "#22C55E",
  500: "#22C55E",
  600: "#16A34A",
  700: "#15803D",
  800: "#166534",
  900: "#14532D",
};

const warningShades = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  DEFAULT: "#F59E0B",
  500: "#F59E0B",
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
};

const dangerShades = {
  50: "#FEF2F2",
  100: "#FEE2E2",
  200: "#FECACA",
  300: "#FCA5A5",
  400: "#F87171",
  DEFAULT: "#EF4444",
  500: "#EF4444",
  600: "#DC2626",
  700: "#B91C1C",
  800: "#991B1B",
  900: "#7F1D1D",
};

const infoShades = {
  50: "#EFF6FF",
  100: "#DBEAFE",
  200: "#BFDBFE",
  300: "#93C5FD",
  400: "#60A5FA",
  DEFAULT: "#3B82F6",
  500: "#3B82F6",
  600: "#2563EB",
  700: "#1D4ED8",
  800: "#1E40AF",
  900: "#1E3A8A",
};

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F9F9F9",
        brand: {
          ...greenShades,
          DEFAULT: greenShades[600],
          dark: greenShades[700],
          light: greenShades[300],
        },
        forest: { ...greenShades },
        mint: { ...greenShades },
        deep: {
          ...deepShades,
          DEFAULT: deepShades[600],
          dark: deepShades[700],
          light: deepShades[500],
        },
        ink: {
          DEFAULT: "#1E293B",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
        success: { ...successShades },
        warning: { ...warningShades },
        danger: { ...dangerShades },
        info: { ...infoShades },
        sun: "#F6B94A",
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(30 41 59 / 0.04), 0 10px 30px rgb(30 41 59 / 0.06)",
        "card-hover": "0 24px 55px -18px rgb(30 41 59 / 0.22)",
        elevated: "0 30px 80px -30px rgb(30 41 59 / 0.38)",
        glow: "0 16px 42px -16px rgb(34 139 34 / 0.55)",
        forest: "0 8px 24px -4px rgb(34 139 34 / 0.35)",
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
