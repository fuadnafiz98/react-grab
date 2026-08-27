import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FORK_RELEASE_DIRECTORY_NAME, FORK_REPOSITORY_URL } from "./fork-release-constants.mjs";

const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const releaseRootDirectory = join(rootDirectory, FORK_RELEASE_DIRECTORY_NAME);

const collectPackageManifests = () => {
  const manifests = [];
  if (!existsSync(releaseRootDirectory)) {
    console.error(`Fork release directory is missing: ${releaseRootDirectory}`);
    process.exit(1);
  }
  for (const entry of readdirSync(releaseRootDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = join(releaseRootDirectory, entry.name, "package.json");
    if (!existsSync(manifestPath)) continue;
    manifests.push(manifestPath);
  }
  return manifests;
};

const offendingPackages = [];

for (const manifestPath of collectPackageManifests()) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.private === true) continue;

  const repositoryUrl =
    typeof manifest.repository === "string" ? manifest.repository : manifest.repository?.url;

  if (repositoryUrl !== FORK_REPOSITORY_URL) {
    offendingPackages.push({
      name: manifest.name,
      manifestPath,
      repositoryUrl: repositoryUrl ?? "(missing)",
    });
  }
}

if (offendingPackages.length > 0) {
  console.error(
    `\nProvenance check failed. npm publish with provenance requires every publishable package to declare repository.url === "${FORK_REPOSITORY_URL}".\n`,
  );
  for (const offendingPackage of offendingPackages) {
    console.error(
      `  - ${offendingPackage.name}: ${offendingPackage.repositoryUrl}\n    ${offendingPackage.manifestPath}`,
    );
  }
  console.error("");
  process.exit(1);
}

console.log("Provenance check passed: all publishable packages declare a matching repository.url.");
