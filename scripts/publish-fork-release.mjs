import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FORK_RELEASE_DIRECTORY_NAME } from "./fork-release-constants.mjs";

const MAX_PUBLISH_ATTEMPTS = 3;
const PUBLISH_RETRY_BASE_DELAY_MS = 15_000;
const releaseDirectoryNames = ["react-grab-cli", "react-grab", "grab"];
const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const releaseRootDirectory = join(rootDirectory, FORK_RELEASE_DIRECTORY_NAME);
const distTag = process.env.NPM_DIST_TAG ?? "latest";

const sleep = (durationMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });

const isPackageVersionPublished = (packageName, version) => {
  const result = spawnSync("npm", ["view", `${packageName}@${version}`, "version", "--json"], {
    encoding: "utf8",
    stdio: "pipe",
  });
  return result.status === 0;
};

const publishPackage = async (releaseDirectory, packageName, version) => {
  for (let attempt = 1; attempt <= MAX_PUBLISH_ATTEMPTS; attempt += 1) {
    const result = spawnSync(
      "npm",
      ["publish", "--access", "public", "--provenance", "--tag", distTag],
      {
        cwd: releaseDirectory,
        encoding: "utf8",
        stdio: "inherit",
      },
    );
    if (result.status === 0) return;
    if (attempt === MAX_PUBLISH_ATTEMPTS) {
      throw new Error(`Failed to publish ${packageName}@${version}`);
    }
    await sleep(PUBLISH_RETRY_BASE_DELAY_MS * attempt);
  }
};

for (const releaseDirectoryName of releaseDirectoryNames) {
  const releaseDirectory = join(releaseRootDirectory, releaseDirectoryName);
  const manifest = JSON.parse(readFileSync(join(releaseDirectory, "package.json"), "utf8"));
  if (isPackageVersionPublished(manifest.name, manifest.version)) {
    console.log(`Already published: ${manifest.name}@${manifest.version}`);
    continue;
  }
  await publishPackage(releaseDirectory, manifest.name, manifest.version);
  console.log(`New tag: ${manifest.name}@${manifest.version}`);
}
