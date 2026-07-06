// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#5d52d9",   // violet par exemple
        secondary: "#4fc5eb", // bleu
      },
    },
  },
  plugins: [],
};
