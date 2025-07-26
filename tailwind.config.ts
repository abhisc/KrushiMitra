// Tailwind CSS configuration for KrushiMitra
import type { Config } from "tailwindcss"

const config = {
  // Enable dark mode via class strategy
  darkMode: ["class"],
  // Paths to all template files for purging unused styles
  content: [
    './pages/**/*.{ts,tsx}', // Next.js pages
    './components/**/*.{ts,tsx}', // Shared components
    './app/**/*.{ts,tsx}', // App directory (Next.js 13+)
    './src/**/*.{ts,tsx}', // Source directory
	],
  prefix: "", // No prefix for utility classes
  theme: {
    container: {
      center: true, // Center the container by default
      padding: "2rem", // Default horizontal padding
      screens: {
        "2xl": "1400px", // Max width for 2xl screens
      },
    },
    extend: {
      // Custom color palette using CSS variables
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
        },
      },
      // Custom border radius values
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // Custom keyframes for accordion animations
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      // Custom animation utilities
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      // Custom font family for headlines
      fontFamily: {
        headline: ["'Google Sans'", "sans-serif"],
      },
    },
  },
  // Plugin for animation utilities
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
