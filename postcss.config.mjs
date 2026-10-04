// Tailwind is used by the web app's pages only (src/app/(app)); the marketing
// pages keep their hand-written globals.css and never import Tailwind.
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
