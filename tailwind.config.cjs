/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class",
  prefix: "x-",
  theme: {
    extend: {
      colors: {
        ...colors,
        primary: "#006dff",
      },
    },
  },
  plugins: [],
};
