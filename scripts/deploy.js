// deploy script: copies .clasp.<env>.json to .clasp.json and pushes dist/ with clasp
const { execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const env = process.argv[2];
const projectName = process.argv[3];

if (!env || !projectName) {
  console.error("Usage: node deploy.js <env> <projectName>");
  process.exit(1);
}

const projectPath = path.join(__dirname, "..", "packages", projectName);
const distPath = path.join(projectPath, "dist");

console.log(`Environment: ${env}`);
console.log(`Project path: ${projectPath}`);

if (!fs.existsSync(distPath)) {
  console.error(
    `dist/ not found for project: ${projectName}. Run "pnpm build" first.`,
  );
  process.exit(1);
}

try {
  const sourceClaspJson = path.join(projectPath, `.clasp.${env}.json`);
  if (!fs.existsSync(sourceClaspJson)) {
    throw new Error(
      `${path.basename(sourceClaspJson)} not found (env: ${env})`,
    );
  }
  fs.copyFileSync(sourceClaspJson, path.join(projectPath, ".clasp.json"));
  console.log(`.clasp.json written from ${path.basename(sourceClaspJson)}`);

  // Copy appsscript.json again in case it changed after the last build
  const appsscriptPath = path.join(projectPath, "appsscript.json");
  if (fs.existsSync(appsscriptPath)) {
    fs.copyFileSync(appsscriptPath, path.join(distPath, "appsscript.json"));
  } else {
    console.warn(`Warning: appsscript.json not found in ${projectPath}`);
  }

  console.log("Files in dist/:");
  console.log(fs.readdirSync(distPath).join("\n"));

  console.log(`Pushing ${projectName} to Google Apps Script...`);
  // rootDir in .clasp.json is ./dist, so only the build output is pushed
  execSync("clasp push", { stdio: "inherit", cwd: projectPath });

  console.log(`${projectName} pushed successfully.`);
} catch (error) {
  console.error(`Error pushing ${projectName}:`, error.message);
  process.exit(1);
}
