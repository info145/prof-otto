import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "mentor-orange": "#FF6200",
        border: "#E5E7EB",
        "bubble-ai": "#F5F5F5",
      },
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,0.08)",
        "soft-md": "0 10px 30px rgba(0,0,0,0.12)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "scale-in": "scale-in 160ms ease-out",
        "bounce-soft": "bounce-soft 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
