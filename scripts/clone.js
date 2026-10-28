// clone script: interactively pulls an existing Apps Script project into packages/,
// moves its code into src/, splits .clasp.json into dev/prod, and generates package.json and README.md
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const rootDir = path.join(__dirname, "..");
const commonConfigPath = path.join(
  rootDir,
  "packages",
  "_common",
  "config",
  "esbuild.config.js",
);
const readmePath = path.join(rootDir, "template", "README.md");
const rootVersion = require(path.join(rootDir, "package.json")).version;

// Project names are kebab-case: lowercase letters and digits separated by hyphens
const PROJECT_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const projectExists = (name) =>
  fs.existsSync(path.join(rootDir, "packages", name));

// Returns why the name cannot be used, or null when it is fine
const projectNameError = (name) => {
  if (!PROJECT_NAME_PATTERN.test(name)) {
    return `"${name}" cannot be used. Use lowercase letters, digits, and hyphens (e.g. my-project).`;
  }
  if (projectExists(name)) {
    return `"${name}" already exists in packages/. Choose another name.`;
  }
  return null;
};

// Keep asking until a valid, unused project name is entered
const resolveProjectName = async (rl) => {
  while (true) {
    const name = (await rl.question("Project name (e.g. my-project): ")).trim();
    if (!name) continue;
    const error = projectNameError(name);
    if (!error) return name;
    console.error(error);
  }
};

const promptProjectInfo = async () => {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const projectName = await resolveProjectName(rl);
    const scriptId = (await rl.question("Script ID: ")).trim();
    if (!scriptId) {
      console.error("Script ID is required.");
      process.exit(1);
    }
    return { projectName, scriptId };
  } finally {
    rl.close();
  }
};

const promptSpreadsheetUrls = async () => {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const devUrl = await rl.question("dev spreadsheet URL (optional): ");
    const prodUrl = await rl.question("prod spreadsheet URL (optional): ");
    return { devUrl: devUrl.trim(), prodUrl: prodUrl.trim() };
  } finally {
    rl.close();
  }
};

// Split .clasp.json into .clasp.prod.json and .clasp.dev.json (both point at dist/)
const splitClaspConfig = (projectPath, claspJsonPath) => {
  const claspConfig = JSON.parse(fs.readFileSync(claspJsonPath, "utf8"));
  claspConfig.rootDir = "./dist";
  fs.writeFileSync(claspJsonPath, JSON.stringify(claspConfig, null, 2));
  fs.renameSync(claspJsonPath, path.join(projectPath, ".clasp.prod.json"));
  fs.copyFileSync(
    path.join(projectPath, ".clasp.prod.json"),
    path.join(projectPath, ".clasp.dev.json"),
  );
  console.log("Created .clasp.prod.json and .clasp.dev.json");
};

// Spreadsheet link placeholders in template/README.md
const SPREADSHEET_PLACEHOLDERS = {
  prod: "### Production\n- [Spreadsheet]()",
  dev: "### Development\n- [Spreadsheet]()",
};

const fillSpreadsheetLink = (content, env, url) => {
  const placeholder = SPREADSHEET_PLACEHOLDERS[env];
  if (!content.includes(placeholder)) {
    console.warn(
      `Warning: the ${env} spreadsheet link was not found in template/README.md, so the URL was not filled in`,
    );
    return content;
  }
  return content.replace(placeholder, placeholder.replace("()", `(${url})`));
};

const writeReadme = (projectPath, devUrl, prodUrl) => {
  if (!fs.existsSync(readmePath)) {
    console.warn(`Warning: ${readmePath} not found`);
    return;
  }
  let content = fs.readFileSync(readmePath, "utf8");
  if (prodUrl) content = fillSpreadsheetLink(content, "prod", prodUrl);
  if (devUrl) content = fillSpreadsheetLink(content, "dev", devUrl);
  fs.writeFileSync(path.join(projectPath, "README.md"), content);
  console.log("Created README.md from template/README.md");
};

const writePackageJson = (projectPath, projectName, devUrl, prodUrl) => {
  const packageJson = {
    name: projectName,
    // Every package shares the root version (enforced by scripts/check-versions.js)
    version: rootVersion,
    private: true,
    scripts: {
      build: `node ../../scripts/build.js ${projectName}`,
      "build:time": `node ../../scripts/build-time.js ${projectName}`,
      "deploy:dev": `node ../../scripts/deploy.js dev ${projectName}`,
      "deploy:prod": `node ../../scripts/deploy.js prod ${projectName}`,
      "open:dev": `node ../../scripts/open.js dev ${projectName}`,
      "open:prod": `node ../../scripts/open.js prod ${projectName}`,
    },
    spreadsheetUrls: { dev: devUrl, prod: prodUrl },
  };
  fs.writeFileSync(
    path.join(projectPath, "package.json"),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
  console.log(`Generated package.json for ${projectName}`);
};

const main = async () => {
  const { projectName, scriptId } = await promptProjectInfo();
  const projectPath = path.join(rootDir, "packages", projectName);
  const srcPath = path.join(projectPath, "src");

  fs.mkdirSync(srcPath, { recursive: true });

  if (process.env.SKIP_CLASP) {
    console.log("Skipping clasp clone (SKIP_CLASP is set)");
  } else {
    console.log(`Cloning ${scriptId} into ${projectPath}...`);
    // Pass the script ID as an argument, not through a shell, so it cannot inject commands
    execFileSync("clasp", ["clone", scriptId], {
      stdio: "inherit",
      cwd: projectPath,
    });
  }

  // Move the downloaded code into src/
  for (const file of fs.readdirSync(projectPath)) {
    if (
      file.endsWith(".js") ||
      file.endsWith(".html") ||
      file.endsWith(".gs")
    ) {
      fs.renameSync(path.join(projectPath, file), path.join(srcPath, file));
    }
  }

  const { devUrl, prodUrl } = await promptSpreadsheetUrls();

  const claspJsonPath = path.join(projectPath, ".clasp.json");
  if (!fs.existsSync(claspJsonPath)) {
    console.error(".clasp.json not found after cloning");
    process.exit(1);
  }
  splitClaspConfig(projectPath, claspJsonPath);

  if (fs.existsSync(commonConfigPath)) {
    fs.copyFileSync(
      commonConfigPath,
      path.join(projectPath, "esbuild.config.js"),
    );
    console.log("Created esbuild.config.js");
  } else {
    console.warn(`Warning: ${commonConfigPath} not found`);
  }

  writeReadme(projectPath, devUrl, prodUrl);
  writePackageJson(projectPath, projectName, devUrl, prodUrl);

  console.log(`${projectName} is ready in packages/${projectName}.`);
};

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
