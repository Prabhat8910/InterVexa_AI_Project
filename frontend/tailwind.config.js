/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0B0F19",
        cardBg: "rgba(255, 255, 255, 0.02)",
        cardBorder: "rgba(255, 255, 255, 0.06)",
        brandPrimary: "#4F46E5",
        brandSecondary: "#EC4899",
        brandAccent: "#10B981",
        textMuted: "#9CA3AF",
        // Light mode tokens
        lightBg: "#F0F4FF",
        lightCard: "rgba(255, 255, 255, 0.85)",
        lightBorder: "rgba(79, 70, 229, 0.12)",
        lightText: "#0F172A",
        lightMuted: "#475569",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-wave': 'pulse-wave 1.5s ease-in-out infinite',
        'spin-once': 'spin 0.4s ease-in-out 1',
      },
      keyframes: {
        'pulse-wave': {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(2.2)' }
        }
      }
    },
  },
  plugins: [],
}
