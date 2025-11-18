module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Require type(scope): [number] message format
    "header-pattern": [2, "always", /^(\w+)\(([\w-]+)\): \[\d+\] .+/],

    // Enforce type-case = lowercase
    "type-case": [2, "always", "lower-case"],

    // Enforce scope-case = kebab-case or lower-case
    "scope-case": [2, "always", ["lower-case", "kebab-case"]],

    // Require a type
    "type-empty": [2, "never"],

    // Require a scope
    "scope-empty": [2, "never"],

    // Restrict allowed types
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
  },
};
