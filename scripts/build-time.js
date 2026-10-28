// build-time script: shows when a project was last built and whether src has newer commits
const path = require("node:path");
const fs = require("node:fs");
const { execSync } = require("node:child_process");

const projectName = process.argv[2];

if (!projectName) {
  console.error("Usage: node build-time.js <projectName>");
  process.exit(1);
}

const projectPath = path.join(__dirname, "..", "packages", projectName);
const configPath = path.join(projectPath, "esbuild.config.js");

if (!fs.existsSync(configPath)) {
  console.error(`Config not found for project: ${projectName}`);
  process.exit(1);
}

const formatTime = (timeMs) => new Date(timeMs).toLocaleString();

/**
 * Returns the last commit time of src/ in ms, or null when there is no history.
 * Uncommitted edits are not taken into account.
 */
const getLatestSrcCommitMs = () => {
  try {
    const output = execSync("git log -1 --format=%ct -- src", {
      cwd: projectPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return output ? Number(output) * 1000 : null;
  } catch (error) {
    console.warn(
      `Warning: could not read the last commit time of src/ from git (${error.message})`,
    );
    return null;
  }
};

const { outfile } = require(configPath);

console.log(`Project: ${projectName}`);

if (!outfile || !fs.existsSync(outfile)) {
  console.log("Status: not built (no build output found)");
  process.exit(0);
}

const buildMtimeMs = fs.statSync(outfile).mtimeMs;
console.log(`Last build:         ${formatTime(buildMtimeMs)}`);

const latestCommitMs = getLatestSrcCommitMs();

if (latestCommitMs === null) {
  console.log("Last src/ commit:   unavailable (no commits or not in git)");
  console.log("Status: up to date (not compared)");
} else {
  console.log(`Last src/ commit:   ${formatTime(latestCommitMs)}`);
  if (latestCommitMs > buildMtimeMs) {
    console.log("Status: outdated (src/ was committed after the last build)");
    console.log('  Run "pnpm build" again before deploying.');
  } else {
    console.log("Status: up to date");
  }
}
