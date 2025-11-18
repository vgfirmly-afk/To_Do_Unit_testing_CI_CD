// eslint.config.cjs
module.exports = [
  // ignore node_modules etc.
  { ignores: ["node_modules/**", "dist/**", "coverage/**", ".nyc_output/**"] },

  // Default rules for JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // add any project-wide globals here if needed
      },
    },
    rules: {
      // make unused args a warning and ignore args that start with underscore:
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "off",
    },
  },

  // Node scripts (scripts/*) - grant node globals like process, console
  {
    files: ["scripts/**/*.js", ".husky/**/*"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      // scripts may use console heavily; keep it allowed
      "no-console": "off",
    },
  },

  // Test files (mocha) - provide mocha globals
  {
    files: ["test/**/*.js", "**/*.spec.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        beforeEach: "readonly",
        after: "readonly",
        afterEach: "readonly",
        context: "readonly",
      },
    },
    rules: {
      // you can relax rules for tests if you want
      "no-unused-expressions": "off",
    },
  },

  // Source files for Cloudflare Worker / Fetch API - Response global
  {
    files: ["src/**/*.js", "index.js"],
    languageOptions: {
      globals: {
        Response: "readonly",
        Request: "readonly",
        fetch: "readonly",
        Headers: "readonly",
      },
    },
    rules: {
      // keep normal rules
    },
  },
];

// // eslint.config.cjs
// module.exports = [
//   // ignore node_modules, build outputs etc.
//   {
//     ignores: ["node_modules/**", "dist/**", "coverage/**"],
//   },

//   // rules for JS files
//   {
//     files: ["**/*.js"],
//     languageOptions: {
//       ecmaVersion: "latest",
//       sourceType: "module",
//     },
//     rules: {
//       // enable some sensible defaults; tweak to taste
//       "no-unused-vars": "warn",
//       "no-undef": "error",
//       "no-console": "off",
//     },
//   },

//   // optionally add Typescript / other overrides here
// ];

// // eslint.config.js (ES module style)
// import recommended from "eslint/conf/eslint-recommended.js";

// export default [
//   recommended,
//   { files: ["**/*.js"], rules: { /* overrides */ } }
// ];
