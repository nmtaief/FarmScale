import type { Config } from "tailwindcss";

export const farmscaleTailwindPreset: Partial<Config> = {
  theme: {
    screens: {
      mobile: "360px",
      tablet: "768px",
      desktop: "1280px",
      // standard tw breakpoints for flex/grid convenience
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        forest: "var(--color-forest)",
        sage: "var(--color-sage)",
        gold: {
          DEFAULT: "var(--color-gold)",
          pressed: "var(--color-gold-pressed)",
          text: "var(--color-gold-text)",
        },
        leaf: "var(--color-leaf)",
        water: {
          DEFAULT: "var(--color-water)",
          text: "var(--color-water-text)",
        },
        heat: "var(--color-heat)",
        muted: "var(--color-muted)",
        bg: "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          hover: "var(--color-surface-hover)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
      },
      textColor: {
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
      },
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      spacing: {
        "1": "var(--space-1)", // 4px
        "2": "var(--space-2)", // 8px
        "3": "var(--space-3)", // 16px
        "4": "var(--space-4)", // 24px
        "5": "var(--space-5)", // 40px
        "6": "var(--space-6)", // 64px
        "7": "var(--space-7)", // 96px
      },
      borderRadius: {
        sm: "var(--radius-sm)", // 8px
        md: "var(--radius-md)", // 16px
        lg: "var(--radius-lg)", // 24px
        full: "var(--radius-full)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        sheet: "var(--shadow-sheet)",
      },
      maxWidth: {
        content: "1200px",
      },
      minHeight: {
        touch: "44px", // Minimum 44px touch targets
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
};

export default farmscaleTailwindPreset;
