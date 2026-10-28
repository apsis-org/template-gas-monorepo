// build script: bundles a project with esbuild and copies appsscript.json and HTML files into dist/
const { build } = require("esbuild");
const path = require("node:path");
const fs = require("node:fs");

const projectName = process.argv[2];

if (!projectName) {
  console.error("Usage: node build.js <projectName>");
  process.exit(1);
}

const projectPath = path.join(__dirname, "..", "packages", projectName);
const configPath = path.join(projectPath, "esbuild.config.js");

if (!fs.existsSync(configPath)) {
  console.error(`Config not found for project: ${projectName}`);
  process.exit(1);
}

// Recursively collect HTML files under dir
const findHtmlFiles = (dir, fileList = []) => {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith(".html")) {
      fileList.push(filePath);
    }
  }
  return fileList;
};

const buildProject = async () => {
  console.log(`Building ${projectName}...`);
  const config = require(configPath);

  const outDir = path.dirname(config.outfile);
  fs.mkdirSync(outDir, { recursive: true });

  try {
    await build(config);
    console.log(`${projectName} built successfully.`);

    const appsscriptPath = path.join(projectPath, "appsscript.json");
    if (fs.existsSync(appsscriptPath)) {
      fs.copyFileSync(appsscriptPath, path.join(outDir, "appsscript.json"));
      console.log("Copied appsscript.json to dist/");
    } else {
      console.warn(`Warning: appsscript.json not found in ${projectPath}`);
    }

    // Apps Script has no folders, so HTML files are flattened into dist/
    for (const originPath of findHtmlFiles(path.join(projectPath, "src"))) {
      const destPath = path.join(outDir, path.basename(originPath));
      fs.copyFileSync(originPath, destPath);
      console.log(`Copied ${path.basename(originPath)} to dist/`);
    }
  } catch (error) {
    console.error(`Error building ${projectName}:`);
    if (error.errors) {
      for (const err of error.errors) {
        console.error("Build error:", err.text);
        console.error("  Location:", err.location);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
};

buildProject();
