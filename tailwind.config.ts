import type { Config } from "tailwindcss";

// Every colour is a CSS variable (see globals.css) so the dark and light
// themes swap with one attribute and no per-component edits.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        surface2: token("surface-2"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        brand: token("brand"),
        brandInk: token("brand-ink"),
        go: token("go"),
        danger: token("danger"),
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      keyframes: {
        ping2: { "0%": { transform: "scale(0.6)", opacity: "0.7" }, "100%": { transform: "scale(2.4)", opacity: "0" } },
        rise: { from: { transform: "translateY(14px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
      },
      animation: { ping2: "ping2 2.2s ease-out infinite", rise: "rise 0.35s ease-out both" },
    },
  },
  plugins: [],
} satisfies Config;
