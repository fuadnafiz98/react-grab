import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FORK_PACKAGE_NAMES } from "./fork-release-constants.mjs";

const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageDirectories = ["packages/react-grab", "packages/cli", "packages/grab"];
const packageConfigurations = packageDirectories.map((packageDirectory) => ({
  manifestPath: join(rootDirectory, packageDirectory, "package.json"),
  changelogPath: join(rootDirectory, packageDirectory, "CHANGELOG.md"),
}));

const readPackageVersion = (manifestPath) => JSON.parse(readFileSync(manifestPath, "utf8")).version;

const isVersionPublished = (packageName, version) => {
  const result = spawnSync("npm", ["view", `${packageName}@${version}`, "version", "--json"], {
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status === 0) return true;
  if (`${result.stdout}\n${result.stderr}`.includes("E404")) return false;
  throw new Error(`Could not check ${packageName}@${version}: ${result.stderr.trim()}`);
};

const getNextPatchVersion = (version) => {
  const versionParts = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!versionParts) throw new Error(`Expected a stable semantic version, received ${version}`);
  const [, majorVersion, minorVersion, patchVersion] = versionParts;
  return `${majorVersion}.${minorVersion}.${Number(patchVersion) + 1}`;
};

const findAvailableVersion = (initialVersion) => {
  let candidateVersion = initialVersion;
  while (
    FORK_PACKAGE_NAMES.some((packageName) => isVersionPublished(packageName, candidateVersion))
  ) {
    candidateVersion = getNextPatchVersion(candidateVersion);
  }
  return candidateVersion;
};

const rewritePackageVersion = (manifestPath, version) => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.version = version;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
};

const findGeneratedReleaseHeading = (changelogPath, version) => {
  const changelog = readFileSync(changelogPath, "utf8");
  const currentHeading = `## ${version}`;
  const headingStart = changelog.indexOf(currentHeading);
  const firstForkHeadingStart = changelog.indexOf("## Fork ");
  return headingStart !== -1 &&
    (firstForkHeadingStart === -1 || headingStart < firstForkHeadingStart)
    ? headingStart
    : null;
};

const rewriteGeneratedChangelogVersion = (
  changelogPath,
  headingStart,
  previousVersion,
  nextVersion,
) => {
  const changelog = readFileSync(changelogPath, "utf8");
  const currentHeading = `## ${previousVersion}`;
  const nextHeadingStart = changelog.indexOf("\n## ", headingStart + currentHeading.length);
  const releaseSectionEnd = nextHeadingStart === -1 ? changelog.length : nextHeadingStart;
  const releaseSection = changelog
    .slice(headingStart, releaseSectionEnd)
    .replaceAll(previousVersion, nextVersion)
    .replace(`## ${nextVersion}`, `## Fork ${nextVersion}`);
  writeFileSync(
    changelogPath,
    `${changelog.slice(0, headingStart)}${releaseSection}${changelog.slice(releaseSectionEnd)}`,
  );
};

const generatedVersions = packageConfigurations.map((configuration) =>
  readPackageVersion(configuration.manifestPath),
);
const generatedVersion = generatedVersions[0];
if (!generatedVersions.every((version) => version === generatedVersion)) {
  throw new Error(`Fork package versions must match: ${generatedVersions.join(", ")}`);
}

const generatedReleaseConfigurations = packageConfigurations.map((configuration) => ({
  ...configuration,
  headingStart: findGeneratedReleaseHeading(configuration.changelogPath, generatedVersion),
}));
const generatedReleaseCount = generatedReleaseConfigurations.filter(
  (configuration) => configuration.headingStart !== null,
).length;

if (generatedReleaseCount !== 0 && generatedReleaseCount !== packageConfigurations.length) {
  throw new Error(`Changesets did not generate matching ${generatedVersion} changelog sections`);
}

if (generatedReleaseCount === packageConfigurations.length) {
  const availableVersion = findAvailableVersion(generatedVersion);
  for (const configuration of packageConfigurations) {
    if (availableVersion !== generatedVersion) {
      rewritePackageVersion(configuration.manifestPath, availableVersion);
    }
  }
  for (const configuration of generatedReleaseConfigurations) {
    rewriteGeneratedChangelogVersion(
      configuration.changelogPath,
      configuration.headingStart,
      generatedVersion,
      availableVersion,
    );
  }
  if (availableVersion !== generatedVersion) {
    console.log(`Adjusted occupied fork version ${generatedVersion} to ${availableVersion}`);
  }
}
