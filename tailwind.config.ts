import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["var(--font-body)", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        paper: { DEFAULT: "#F3F5F8", raised: "#FFFFFF", sunk: "#E8ECF1" },
        ink: { DEFAULT: "#14181F", muted: "#454F5F", subtle: "#586274" },
        line: { DEFAULT: "#D3D9E0", strong: "#14181F" },
        teal: { DEFAULT: "#0B6E69", 50: "#E1F3F1" },
        amber: { DEFAULT: "#7A4A00", 50: "#FFF0CC", solid: "#F2B84B" },
        late: { DEFAULT: "#A8300F", 50: "#FFE8E0" },
        severe: { DEFAULT: "#7A1010", 50: "#FADADA" },
        error: "#B42318",
      },
      borderRadius: { xs: "3px", sm: "6px", md: "10px" },
      boxShadow: { pop: "0 10px 30px rgba(20, 24, 31, 0.16)" },
    },
  },
  plugins: [],
};

export default config;
