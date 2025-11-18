// commitlint.config.cjs
module.exports = {
  extends: ["@commitlint/config-conventional"],

  // Make commitlint parse your custom header into parts
  parserPreset: {
    parserOpts: {
      // headerPattern must match the whole header and capture groups
      headerPattern: /^([a-z]+)\(([a-z0-9-]+)\): \[(\d+)\] (.+)$/,
      // map capture groups to names commitlint will provide to rules
      headerCorrespondence: ["type", "scope", "ticket", "subject"],
    },
  },

  // Add an inline plugin that implements a custom rule "header-pattern"
  // which tests the commit header against our regex and returns an error message.
  plugins: [
    {
      rules: {
        "header-pattern": (parsed) => {
          // parsed.header contains the full header string
          const re = /^([a-z]+)\(([a-z0-9-]+)\): \[(\d+)\] (.+)$/;
          const ok = re.test(parsed.header || "");
          return [
            ok,
            "Header must be: <type>(scope): [number] short description (e.g. feat(api): [123] add endpoint)",
          ];
        },
      },
    },
  ],

  rules: {
    // enforce our custom header pattern (the plugin implements it)
    "header-pattern": [2, "always"],

    // conventional checks you likely want
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "test",
        "chore",
        "ci",
        "build",
        "perf",
        "revert",
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "scope-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-min-length": [2, "always", 3],
  },
};
