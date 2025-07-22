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
      // Custom color palette using CSS variables and HSL
      colors: {
        border: "hsl(220, 13%, 91%)", // Light gray border for white background
        input: "hsl(0, 0%, 100%)", // Input background matches white
        ring: "hsl(213, 100%, 60%)", // Blue ring for focus
        background: "hsl(0, 0%, 100%)", // Set main background to white
        foreground: "hsl(222, 47%, 11%)", // Dark gray/black for text
        primary: {
          // Using Google Blue as primary
          DEFAULT: "hsl(113, 61.50%, 30.60%)", // Main primary color
          foreground: "hsl(0, 0%, 100%)", // White text on primary
        },
        secondary: {
          // Using a lighter blue/cyan as secondary
          DEFAULT: "hsl(200, 100%, 96%)", // Lighter blue for secondary
          foreground: "hsl(222, 47%, 11%)", // Dark text on secondary
        },
        destructive: {
          DEFAULT: "hsl(0, 84%, 60%)", // Red for destructive actions
          foreground: "hsl(0, 0%, 100%)", // White text on destructive
        },
        muted: {
          DEFAULT: "hsl(220, 13%, 96%)", // Very light gray for muted backgrounds
          foreground: "hsl(220, 8%, 50%)", // Muted gray text
        },
        accent: {
          // Using a subtle gray/blue for accent
          DEFAULT: "hsl(210, 20%, 98%)", // Very light blue/gray accent
          foreground: "hsl(222, 47%, 11%)", // Dark text on accent
        },
        popover: {
          DEFAULT: "hsl(0, 0%, 100%)", // White popover background
          foreground: "hsl(222, 47%, 11%)", // Dark text on popover
        },
        card: {
          DEFAULT: "hsl(0, 0%, 100%)", // White card background
          foreground: "hsl(222, 47%, 11%)", // Dark text on card
        },
        sidebar: {
          DEFAULT: "hsl(220, 13%, 96%)", // Light gray sidebar
          foreground: "hsl(222, 47%, 11%)", // Dark text on sidebar
          border: "hsl(220, 13%, 91%)", // Sidebar border
          ring: "hsl(213, 100%, 60%)", // Sidebar ring
          accent: "hsl(210, 20%, 98%)", // Sidebar accent
          "accent-foreground": "hsl(222, 47%, 11%)", // Text on sidebar accent
        },
      },
      // Custom border radius values
      borderRadius: {
        lg: "var(--radius)", // Large radius
        md: "calc(var(--radius) - 2px)", // Medium radius
        sm: "calc(var(--radius) - 4px)", // Small radius
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
