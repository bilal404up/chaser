import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },

    // Full override: only the "night ledger" palette is reachable.
    colors: {
      transparent: "transparent",
      current: "currentColor",

      desk: { DEFAULT: "#0E1613", 2: "#15201C", deep: "#080D0B" },
      chalk: "#A9B7B0",
      paper: { DEFAULT: "#F1EDE3", 2: "#E6DFCD", 3: "#D8CBAE" },
      ink: { DEFAULT: "#151719", 2: "#4B4F53" },
      stamp: { DEFAULT: "#C0321F", lit: "#F0624D" },
      ochre: "#94560B",
      carbon: { DEFAULT: "#2D4C9E", lit: "#9FB4F0" },
    },

    fontFamily: {
      sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      mono: ["var(--font-mono)", "ui-monospace", "monospace"],
    },

    // One paper shadow for strips on the desk. No hard offsets, no filter shadows.
    boxShadow: {
      none: "none",
      paper: "0 1px 0 rgba(0,0,0,.25), 0 18px 30px -18px rgba(0,0,0,.6)",
    },

    // Paper is square; buttons and inputs get 3px. No pills.
    borderRadius: { none: "0", DEFAULT: "3px", full: "9999px" },

    extend: {
      maxWidth: { wrap: "75rem", app: "64rem", copy: "60ch", drawer: "30rem" },
      zIndex: { header: "30", scrim: "50", drawer: "60" },
      transitionTimingFunction: { out: "cubic-bezier(.2,.7,.1,1)" },
      transitionDuration: { 140: "140ms", 220: "220ms", 520: "520ms" },
    },
  },
  plugins: [],
};

export default config;
