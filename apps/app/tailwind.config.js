function opacity() {
  const values = Array.from({ length: 21 }, (_, i) => ({
    [i * 5]: `${(i * 5) / 100}`,
  })).reduce((acc, cur) => ({ ...acc, ...cur }), {});
  return {
    ...values,
    1: "0.01",
    2: "0.02",
    3: "0.03",
    4: "0.04",
    6: "0.06",
    7: "0.07",
    8: "0.08",
    9: "0.09",
    11: "0.11",
    12: "0.12",
  };
}

function zIndex() {
  const values = Array.from({ length: 51 }, (_, i) => ({
    [i]: i,
  })).reduce((acc, cur) => ({ ...acc, ...cur }), {});
  return { ...values, select: "20", auto: "auto" };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["media", "class"],
  theme: {
    extend: {
      width: {
        5.5: "1.375rem",
        6.5: "1.625rem",
        7.5: "1.875rem",
        8.5: "2.125rem",
        9.5: "2.375rem",
      },
      maxWidth: {
        "8xl": "92rem",
      },
      height: {
        5.5: "1.375rem",
        6.5: "1.625rem",
        7.5: "1.875rem",
        8.5: "2.125rem",
        9.5: "2.375rem",
      },
      backgroundColor: {
        surface: {
          50: "var(--surface-50)",
          100: "var(--surface-100)",
          200: "var(--surface-200)",
        },
      },
      borderColor: {
        DEFAULT: "var(--border-color-default)",
        dark: "var(--border-color-dark)",
        primary: "var(--border-color-primary)",
        secondary: "var(--border-color-secondary)",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        DEFAULT: "6px",
        inherit: "inherit",
        oval: "50%",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
      },
      colors: {
        white: "#FFFFFF",
        black: "#131316",
        vantablack: "#000000",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "#EEEEF0",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gray: {
          25: "#FAFAFB",
          50: "#F7F7F8",
          100: "#EEEEF0",
          150: "#E3E3E7",
          200: "#D9D9DE",
          300: "#B7B8C2",
          400: "#9394A1",
          500: "#747686",
          600: "#5E5F6E",
          700: "#42434D",
          750: "#373840",
          800: "#2F3037",
          850: "#27272D",
          900: "#212126",
          925: "#111214",
          950: "#0b0d0e",
        },
        purple: {
          100: "#EAE8FF",
          200: "#D7D4FF",
          300: "#BAB1FF",
          400: "#9785FF",
          500: "#6C47FF",
          600: "#6430F7",
          700: "#561EE3",
          800: "#4818BF",
          900: "#3C169C",
          950: "#230B6A",
          "050": "#F4F2FF",
          DEFAULT: "#6C47FF",
        },
        sky: {
          100: "#CCF9FF",
          200: "#9FF1FF",
          300: "#5DE3FF",
          400: "#3AD4FD",
          500: "#00AEE3",
          600: "#0089BE",
          700: "#056D99",
          800: "#0E597C",
          900: "#104A69",
          950: "#043048",
          "050": "#EBFDFF",
          DEFAULT: "#6C47FF",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      fontSize: {
        "2xs": [
          "0.625rem",
          {
            lineHeight: "0.8125rem",
          },
        ],
        xs: [
          "0.6875rem",
          {
            lineHeight: "0.875rem",
          },
        ],
        sm: [
          "0.75rem",
          {
            lineHeight: "1rem",
          },
        ],
        base: [
          "0.875rem",
          {
            lineHeight: "1.25rem",
          },
        ],
        lg: [
          "0.9375rem",
          {
            lineHeight: "1.3125rem",
          },
        ],
        xl: [
          "1.0625rem",
          {
            lineHeight: "1.5rem",
          },
        ],
        "2xl": [
          "1.25rem",
          {
            lineHeight: "1.75rem",
          },
        ],
        "3xl": [
          "1.5rem",
          {
            lineHeight: "2rem",
          },
        ],
        "4xl": [
          "2rem",
          {
            lineHeight: "2.25rem",
          },
        ],
        // Ceramic-inspired heading sizes
        "heading-1": [
          "2rem",
          {
            lineHeight: "2.5rem",
            letterSpacing: "-0.02em",
            fontWeight: "600",
          },
        ],
        "heading-2": [
          "1.75rem",
          {
            lineHeight: "2.25rem",
            letterSpacing: "-0.015em",
            fontWeight: "550",
          },
        ],
        "heading-3": [
          "1.625rem",
          {
            lineHeight: "2.125rem",
            letterSpacing: "-0.0125em",
            fontWeight: "525",
          },
        ],
        "heading-4": [
          "1.5rem",
          {
            lineHeight: "2rem",
            letterSpacing: "-0.01em",
            fontWeight: "500",
          },
        ],
        "heading-5": [
          "1.25rem",
          {
            lineHeight: "1.75rem",
            letterSpacing: "-0.0075em",
            fontWeight: "500",
          },
        ],
        "heading-6": [
          "1.125rem",
          {
            lineHeight: "1.625rem",
            letterSpacing: "-0.005em",
            fontWeight: "500",
          },
        ],
      },
      fontWeight: {
        book: "450",
      },
      letterSpacing: {
        tighter: "-0.02em",
        tight: "-0.01em",
      },
      keyframes: {
        slideDown: {
          from: {
            height: "0px",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        slideUp: {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0px",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "button-bounce-down": {
          "0%": {
            transform: "scale(1)",
          },
          "100%": {
            transform: "scale(0.95)",
          },
        },
        "button-bounce-up": {
          "0%": {
            transform: "scale(0.95)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        blink: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.3",
          },
        },
        typing: {
          "0%, 100%": {
            transform: "translateY(0)",
            opacity: "0.5",
          },
          "50%": {
            transform: "translateY(-2px)",
            opacity: "1",
          },
        },
        "loading-dots": {
          "0%, 100%": {
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
        },
        wave: {
          "0%, 100%": {
            transform: "scaleY(1)",
          },
          "50%": {
            transform: "scaleY(0.6)",
          },
        },
        "text-blink": {
          "0%, 100%": {
            color: "var(--primary)",
          },
          "50%": {
            color: "var(--muted-foreground)",
          },
        },
        "bounce-dots": {
          "0%, 100%": {
            transform: "scale(0.8)",
            opacity: "0.5",
          },
          "50%": {
            transform: "scale(1.2)",
            opacity: "1",
          },
        },
        "thin-pulse": {
          "0%, 100%": {
            transform: "scale(0.95)",
            opacity: "0.8",
          },
          "50%": {
            transform: "scale(1.05)",
            opacity: "0.4",
          },
        },
        "pulse-dot": {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "0.8",
          },
          "50%": {
            transform: "scale(1.5)",
            opacity: "1",
          },
        },
        "shimmer-text": {
          "0%": {
            backgroundPosition: "150% center",
          },
          "100%": {
            backgroundPosition: "-150% center",
          },
        },
        "wave-bars": {
          "0%, 100%": {
            transform: "scaleY(1)",
            opacity: "0.5",
          },
          "50%": {
            transform: "scaleY(0.6)",
            opacity: "1",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "200% 50%",
          },
          "100%": {
            backgroundPosition: "-200% 50%",
          },
        },
        "spinner-fade": {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        slideDown: "slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1)",
        slideUp: "slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1)",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "button-bounce-down": "button-bounce-down 100ms ease-out forwards",
        "button-bounce-up": "button-bounce-up 150ms ease-out forwards",
        blink: "blink 1s ease-in-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      minHeight: {
        screen: "100dvh",
      },
      textColor: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        placeholder: "var(--text-placeholder)",
      },
      spacing: {
        px: "0.0625rem",
        xs: "0.125rem",
        sm: "0.1875rem",
        4.5: "1.125rem",
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "system-ui", "monospace"],
      },
    },
    opacity: opacity(),
    zIndex: zIndex(),
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("tailwind-scrollbar-hide"),
  ],
};
