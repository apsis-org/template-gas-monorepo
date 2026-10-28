// open script: opens the dev/prod spreadsheet listed in the project's package.json
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const env = process.argv[2];
const projectName = process.argv[3];

if (!env || !projectName) {
  console.error("Usage: node open.js <env> <projectName>");
  process.exit(1);
}

if (env !== "dev" && env !== "prod") {
  console.error(`Invalid env: ${env} (use "dev" or "prod")`);
  process.exit(1);
}

const packageJsonPath = path.join(
  __dirname,
  "..",
  "packages",
  projectName,
  "package.json",
);

if (!fs.existsSync(packageJsonPath)) {
  console.error(`package.json not found for project: ${projectName}`);
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const url = packageJson.spreadsheetUrls?.[env];

if (!url) {
  console.error(
    `spreadsheetUrls.${env} is not set in package.json (${projectName})`,
  );
  console.error(
    'Add it to package.json like this:\n  "spreadsheetUrls": { "dev": "...", "prod": "https://docs.google.com/spreadsheets/d/.../edit" }',
  );
  process.exit(1);
}

// Browser launch command for each OS
const getOpener = (target) => {
  switch (process.platform) {
    case "darwin":
      return { cmd: "open", args: [target] };
    case "win32":
      return { cmd: "cmd", args: ["/c", "start", "", target] };
    default:
      return { cmd: "xdg-open", args: [target] };
  }
};

const { cmd, args } = getOpener(url);

console.log(`Opening the ${env} spreadsheet of ${projectName}`);
console.log(url);

const result = spawnSync(cmd, args, { stdio: "inherit" });

if (result.error) {
  console.error(`Failed to open the browser: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`The browser command exited with code ${result.status}`);
  process.exit(1);
}
