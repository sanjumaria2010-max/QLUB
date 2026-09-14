/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Archivo", "ui-sans-serif", "system-ui"],
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        qlub: {
          purple: "#7d00b5",
          "purple-700": "#6b009d",
          "purple-600": "#8b1cc9",
          "purple-500": "#a855f7",
          "purple-400": "#c084fc",
          "purple-200": "#e9d5ff",
          "purple-100": "#f3e8ff",
          "purple-50": "#faf5ff",
          lavender: "#e9d5ff",
          "lavender-soft": "#f5ecff",
          emerald: "#10b981",
          "emerald-600": "#059669",
          ink: "#0e0d13",
          paper: "#ffffff",
          cream: "#faf8fb",
          line: "#eeeaf2",
          "text-muted": "#6b6477",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "pulse-node": {
          "0%,100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.4)" },
        },
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(3.5)", opacity: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pin-pop": {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pulse-node": "pulse-node 2.4s ease-in-out infinite",
        "ping-slow": "ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        scanline: "scanline 3.5s linear infinite",
        "pin-pop": "pin-pop .35s ease-out both",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,10,40,0.04), 0 8px 24px rgba(80,40,160,0.06)",
        "soft-lg": "0 4px 10px rgba(16,10,40,0.05), 0 20px 50px rgba(80,40,160,0.08)",
        lavender: "0 10px 30px rgba(125, 0, 181, 0.12)",
        "neon-purple": "0 0 30px rgba(125, 0, 181, 0.45)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
