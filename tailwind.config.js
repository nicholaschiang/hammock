module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
    container: {
      screens: {
         sm: "100%",
         md: "600px",
         lg: "800px",
         xl: "800px"
      }
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
