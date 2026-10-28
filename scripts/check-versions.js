// check-versions script: fails when a package under packages/ has a different version from the root package.json,
// so the whole monorepo always shares one version
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const packagesDir = path.join(rootDir, "packages");

const readVersion = (packageJsonPath) =>
  JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version;

const rootVersion = readVersion(path.join(rootDir, "package.json"));

const mismatches = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(packagesDir, entry.name, "package.json"))
  .filter((packageJsonPath) => fs.existsSync(packageJsonPath))
  .map((packageJsonPath) => ({
    file: path.relative(rootDir, packageJsonPath),
    version: readVersion(packageJsonPath),
  }))
  .filter(({ version }) => version !== rootVersion);

if (mismatches.length > 0) {
  console.error(`Version mismatch: the root package.json is ${rootVersion}`);
  for (const { file, version } of mismatches) {
    console.error(`  ${file}: ${version}`);
  }
  process.exit(1);
}

console.log(`All packages share version ${rootVersion}`);
