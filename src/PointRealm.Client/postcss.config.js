export default {
  plugins: {
    "@tailwindcss/postcss": {
      // Reference the legacy config for plugins compatibility
      config: "./tailwind.config.js"
    },
    autoprefixer: {},
  },
}
