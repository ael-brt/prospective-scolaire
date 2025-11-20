import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b1021",
        panel: "#11182f",
        accent: "#4fd1c5",
        muted: "#9fb3c8",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 10px 40px rgba(79, 209, 197, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
