// eslint.config.cjs
module.exports = [
  // ignore node_modules, build outputs etc.
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**"]
  },

  // rules for JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      // enable some sensible defaults; tweak to taste
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off"
    }
  },

  // optionally add Typescript / other overrides here
];




// // eslint.config.js (ES module style)
// import recommended from "eslint/conf/eslint-recommended.js";

// export default [
//   recommended,
//   { files: ["**/*.js"], rules: { /* overrides */ } }
// ];
