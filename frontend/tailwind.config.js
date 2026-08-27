/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        ink: "var(--ink)",
        muted: "var(--muted)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        'surface-strong': "var(--surface-strong)",
        line: "var(--line)",
        forest: "var(--forest)",
        'forest-soft': "var(--forest-soft)",
        rust: "var(--rust)",
        'accent-soft': "var(--accent-soft)",
        'accent-border': "var(--accent-border)",
        'quote-ink': "var(--quote-ink)",
        'quote-border': "var(--quote-border)",
        'hover-border': "var(--hover-border)",
        'body-glow-1': "var(--body-glow-1)",
        'body-glow-2': "var(--body-glow-2)",
        'feedback-bg': "var(--feedback-bg)",
        'feedback-border': "var(--feedback-border)",
        'feedback-ink': "var(--feedback-ink)",
      },
      boxShadow: {
        custom: "0 1.5rem 4rem var(--shadow-color)",
        'custom-hover': "0 1rem 2rem var(--shadow-color)",
      },
      maxWidth: {
        'site': 'min(100% - 3rem, 1200px)',
      },
    },
  },
  plugins: [],
}

