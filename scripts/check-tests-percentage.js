// scripts/check-tests-percentage.js
// Runs mocha programmatically via npx, parses JSON reporter output,
// and exits non-zero if pass percentage < REQUIRED_PERCENT.

// const { exec } = require("child_process");
// const path = require("path");
import path from "path";
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
