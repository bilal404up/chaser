import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },

    // Full override: only palette colours are reachable. Legacy aliases at the bottom keep
    // untouched pages rendering; delete them once nothing uses them.
    colors: {
      transparent: "transparent",
      current: "currentColor",

      tape: { DEFAULT: "#F2EFE6", aged: "#EEE8D8", worn: "#E9E0CB" },
      chalk: "#B9C7C0",
      ink: { DEFAULT: "#1B1F24", muted: "#4B5159", faint: "#C9C3B4" },
      blotter: { DEFAULT: "#143D36", raised: "#1C4A42", deep: "#0F2E29" },
      stamp: "#B82C25",
      carbon: "#2E4E9C",
      ochre: "#8F5A10",

      // legacy aliases (old token -> new value)
      paper: { DEFAULT: "#F2EFE6", raised: "#F2EFE6", sunk: "#EEE8D8" },
      line: { DEFAULT: "#C9C3B4", strong: "#0F2E29" },
      teal: { DEFAULT: "#2E4E9C", 50: "#EEE8D8" },
      amber: { DEFAULT: "#1B1F24", 50: "#F2EFE6", solid: "#8F5A10" },
      late: { DEFAULT: "#8F5A10", 50: "#EEE8D8" },
      severe: { DEFAULT: "#B82C25", 50: "#E9E0CB" },
      error: "#B82C25",
    },

    fontFamily: {
      display: ["var(--font-display)", "system-ui", "sans-serif"],
      body: ["var(--font-body)", "system-ui", "sans-serif"],
      mono: ["var(--font-mono)", "ui-monospace", "monospace"],
    },

    // Full override: no soft shadows exist. Stacks are hard offsets in blotter-deep.
    boxShadow: {
      none: "none",
      stack: "4px 6px 0 0 #0F2E29",
      "stack-sm": "2px 3px 0 0 #0F2E29",
      underline: "inset 0 -2px 0 currentColor",
    },

    // Full override: paper is square, buttons are cut paper.
    borderRadius: { none: "0", cut: "2px", full: "9999px" },

    extend: {
      fontSize: {
        display: ["5.5rem", { lineHeight: "0.92", letterSpacing: "-0.03em", fontWeight: "800" }],
        title: ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "700" }],
        section: ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        body: ["1rem", { lineHeight: "1.5" }],
        small: ["0.875rem", { lineHeight: "1.45" }],
        micro: ["0.8125rem", { lineHeight: "1.4" }],
        "fig-xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.04em", fontWeight: "800" }],
        "fig-lg": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.04em", fontWeight: "800" }],
        "fig-md": ["2.5rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "800" }],
        "fig-amount": ["1.25rem", { lineHeight: "1.2", fontWeight: "500" }],
        "fig-sm": ["0.875rem", { lineHeight: "1.4", fontWeight: "500" }],
      },
      letterSpacing: { stamp: "0.04em" },
      spacing: {
        demo: "var(--demo-h)",
        header: "var(--header-h)",
        tear: "var(--tear-h)",
      },
      maxWidth: { wrap: "80rem", copy: "60ch", drawer: "30rem" },
      minHeight: { tap: "44px", strip: "112px", "strip-m": "168px" },
      zIndex: { rail: "10", tag: "20", demo: "40", scrim: "50", drawer: "60" },
      rotate: { t2: "-0.6deg", t3: "1deg", stamp: "-6deg", paid: "-8deg", ring: "-4deg" },
      transitionTimingFunction: {
        out: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        print: "steps(24, end)",
      },
      transitionDuration: { 120: "120ms", 180: "180ms", 240: "240ms" },
      gridTemplateColumns: {
        board: "11rem minmax(0, 1fr) 22.5rem",
        hero: "5fr 7fr",
      },
    },
  },
  plugins: [],
};

export default config;
