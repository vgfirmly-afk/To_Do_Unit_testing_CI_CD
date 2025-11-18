// scripts/check-tests-percentage.js
// Runs mocha programmatically via npx, parses JSON reporter output,
// and exits non-zero if pass percentage < REQUIRED_PERCENT.

// const { exec } = require("child_process");
// const path = require("path");
// import path from "path";
import { exec } from "child_process";

const requiredPercent = Number(process.env.REQUIRED_PERCENT ?? 80);

function runMochaJson() {
  return new Promise((resolve, reject) => {
    // use npx so it uses local mocha; --no-colors to avoid color codes
    // --exit is important if your tests rely on process cleanup
    const cmd = "npx mocha --reporter json --no-colors --exit";
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      // If mocha process itself failed to start, reject with stderr
      if (err && !stdout) {
        return reject(new Error(stderr || err.message));
      }

      // stdout should be the JSON reporter output
      try {
        const out = stdout.trim();
        if (!out) {
          return reject(new Error("No output from mocha json reporter."));
        }
        const json = JSON.parse(out);
        return resolve(json);
      } catch (parseErr) {
        // If parsing fails, include stdout/err to help debugging
        console.log(parseErr);
        const message = [
          "Failed to parse mocha JSON output.",
          "Raw stdout:",
          stdout,
          "stderr:",
          stderr,
        ].join("\n\n");
        return reject(new Error(message));
      }
    });
  });
}

(async function main() {
  try {
    const result = await runMochaJson();
    const stats = result.stats || {};
    const passes = Number(stats.passes || 0);
    const tests = Number(stats.tests || 0);
    const failures = Number(stats.failures || 0);
    const pending = Number(stats.pending || 0);

    if (tests === 0) {
      console.error("No tests were run. Aborting push.");
      process.exit(1);
    }

    const percent = (passes / tests) * 100;
    const percentRounded = Math.round(percent * 100) / 100;

    console.log(
      `\nMocha results: ${passes}/${tests} passed (${percentRounded}%).`,
    );
    console.log(`Failures: ${failures}, Pending: ${pending}`);

    if (percent < requiredPercent) {
      console.error(
        `\nPush blocked — pass rate ${percentRounded}% is below required ${requiredPercent}%.`,
      );

      // print failing test titles (if available) to help the developer
      if (Array.isArray(result.failures) && result.failures.length > 0) {
        console.error("\nFailing tests:");
        result.failures.forEach((f, idx) => {
          const title = f.fullTitle || f.title || `#${idx + 1}`;
          console.error(`  - ${title}`);
        });
      }

      // exit non-zero to block push
      process.exit(1);
    } else {
      console.log(
        `\nPass rate ${percentRounded}% >= required ${requiredPercent}%. Proceeding with push.`,
      );
      process.exit(0);
    }
  } catch (err) {
    console.error(
      "\nError running tests/processing results:\n",
      err.message || err,
    );
    process.exit(1);
  }
})();

// # npm run coverage

// echo "Checking test coverage..."

// # Run coverage and capture its stdout/stderr into a variable, then print it
// echo "Generating coverage..."
// COVERAGE_OUTPUT="$(npm run coverage 2>&1)"

// # Try to extract the "Lines" percentage from the coverage output without reading files.
// # Primary approach: find the "All files" row (jest/nyc table) and take the last column (Lines).
// LINE="$(printf "%s\n" "$COVERAGE_OUTPUT" | grep -i -E '^\s*All files' | head -1)"

// if [ -n "$LINE" ]; then
//   # normalize separators, collapse spaces, take last field, remove possible % sign
//   CLEAN_LINE="$(printf "%s\n" "$LINE" | tr '|' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//')"
//   COVERAGE_PCT="$(printf "%s\n" "$CLEAN_LINE" | awk '{print $NF}' | tr -d '%')"
// fi

// # # Fallback: grep a "Lines ...%" pattern (other reporters)
// # if [ -z "$COVERAGE_PCT" ]; then
// #   COVERAGE_PCT="$(printf "%s\n" "$COVERAGE_OUTPUT" | grep -i -Eo 'Lines[^0-9%]*[0-9]+(\.[0-9]+)?%' | grep -Eo '[0-9]+(\.[0-9]+)?' | head -1)"
// # fi

// # # Another fallback to any percent number if still missing (take first percent-looking number)
// # if [ -z "$COVERAGE_PCT" ]; then
// #   COVERAGE_PCT="$(printf "%s\n" "$COVERAGE_OUTPUT" | grep -Eo '[0-9]+(\.[0-9]+)?%' | tr -d '%' | head -1)"
// # fi

// # default to 0 if we couldn't parse anything
// # if [ -z "$COVERAGE_PCT" ]; then
// #   COVERAGE_PCT="0"
// # fi

// echo "Coverage (lines): ${COVERAGE_PCT}%"

// # threshold (default 10, override with COVERAGE_THRESHOLD env var)
// THRESHOLD="${COVERAGE_THRESHOLD:-90}"
// echo "Required threshold: ${THRESHOLD}%"

// # compare as floats using awk
// OK="$(awk -v a="$COVERAGE_PCT" -v b="$THRESHOLD" 'BEGIN{if (a+0 >= b+0) print 1; else print 0}')"

// if [ "$OK" -ne 1 ]; then
//   echo "❌ Coverage ${COVERAGE_PCT}% is below required ${THRESHOLD}% — commit blocked"
//   exit 1
// fi

// echo "✅ Coverage ${COVERAGE_PCT}% meets threshold ${THRESHOLD}% — commit allowed"
