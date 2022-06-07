const defaultTheme = require("tailwindcss/defaultTheme");

const colors = {
  // https://javisperez.github.io/tailwindcolorshades/?fern=5ABC76&sunglo=EE6D6D&gold=DB9D41&blue=5A9FBC&dark-blue=2E5262
  canvas: {
    50: "#f5f6f7",
    100: "#eaeeef",
    200: "#cbd4d8",
    300: "#abbac0",
    400: "#6d8691",
    500: "#2E5262",
    600: "#294a58",
    700: "#233e4a",
    800: "#1c313b",
    900: "#172830",
  },
  gold: {
    50: "#fdfaf6",
    100: "#fbf5ec",
    200: "#f6e7d0",
    300: "#f1d8b3",
    400: "#e6ba7a",
    500: "#DB9D41",
    600: "#c58d3b",
    700: "#a47631",
    800: "#835e27",
    900: "#6b4d20",
  },
  sky: {
    50: "#f7fafc",
    100: "#eff5f8",
    200: "#d6e7ee",
    300: "#bdd9e4",
    400: "#8cbcd0",
    500: "#5A9FBC",
    600: "#518fa9",
    700: "#44778d",
    800: "#365f71",
    900: "#2c4e5c",
  },
  fern: {
    50: "#f7fcf8",
    100: "#eff8f1",
    200: "#d6eedd",
    300: "#bde4c8",
    400: "#8cd09f",
    500: "#5ABC76",
    600: "#51a96a",
    700: "#448d59",
    800: "#367147",
    900: "#2c5c3a",
  },
  sunglo: {
    50: "#fef8f8",
    100: "#fdf0f0",
    200: "#fbdbdb",
    300: "#f8c5c5",
    400: "#f39999",
    500: "#EE6D6D",
    600: "#d66262",
    700: "#b35252",
    800: "#8f4141",
    900: "#753535",
  },
};

module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
    // "./express-server/read-key-template.html", // no idea why but this is not working...
  ],
  theme: {
    extend: {
      textColor: "canvas-500",
      FontFamily: {
        sans: ["Source Code Pro", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ...colors,
        blue: colors.sky,
        red: colors.sunglo,
        green: colors.fern,
      },
    },
  },
  plugins: [require("flowbite/plugin"), require("@tailwindcss/typography")],
};
