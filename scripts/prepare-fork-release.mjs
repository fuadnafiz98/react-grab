import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FORK_CLI_PACKAGE_NAME,
  FORK_GRAB_PACKAGE_NAME,
  FORK_REACT_GRAB_PACKAGE_NAME,
  FORK_RELEASE_DIRECTORY_NAME,
  FORK_REPOSITORY_URL,
  FORK_REPOSITORY_WEB_URL,
} from "./fork-release-constants.mjs";

const rootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const releaseRootDirectory = join(rootDirectory, FORK_RELEASE_DIRECTORY_NAME);
const releaseVersion = process.env.FORK_VERSION;

const packageConfigurations = [
  {
    sourceDirectory: join(rootDirectory, "packages", "cli"),
    releaseDirectoryName: "react-grab-cli",
    packageName: FORK_CLI_PACKAGE_NAME,
  },
  {
    sourceDirectory: join(rootDirectory, "packages", "react-grab"),
    releaseDirectoryName: "react-grab",
    packageName: FORK_REACT_GRAB_PACKAGE_NAME,
  },
  {
    sourceDirectory: join(rootDirectory, "packages", "grab"),
    releaseDirectoryName: "grab",
    packageName: FORK_GRAB_PACKAGE_NAME,
  },
];

const copyPackageFile = (sourceDirectory, releaseDirectory, relativePath) => {
  const sourcePath = join(sourceDirectory, relativePath);
  if (!existsSync(sourcePath)) return;
  const releasePath = join(releaseDirectory, relativePath);
  mkdirSync(dirname(releasePath), { recursive: true });
  cpSync(sourcePath, releasePath, { recursive: true });
};

const rewriteInternalDependencies = (dependencies, version) => {
  if (!dependencies?.["@react-grab/cli"]) return dependencies;
  const rewrittenDependencies = { ...dependencies };
  delete rewrittenDependencies["@react-grab/cli"];
  rewrittenDependencies[FORK_CLI_PACKAGE_NAME] = version;
  return rewrittenDependencies;
};

const normalizeBinPaths = (bin) => {
  if (!bin || typeof bin === "string") return bin;
  return Object.fromEntries(
    Object.entries(bin).map(([commandName, commandPath]) => [
      commandName,
      commandPath.replace(/^\.\//, ""),
    ]),
  );
};

const rewriteCliBinImport = (releaseDirectory) => {
  const binPath = join(releaseDirectory, "bin", "cli.js");
  if (!existsSync(binPath)) return;
  const binContent = readFileSync(binPath, "utf8").replaceAll(
    '"@react-grab/cli"',
    `"${FORK_CLI_PACKAGE_NAME}"`,
  );
  writeFileSync(binPath, binContent);
};

rmSync(releaseRootDirectory, { recursive: true, force: true });
mkdirSync(releaseRootDirectory, { recursive: true });

for (const configuration of packageConfigurations) {
  const sourceManifestPath = join(configuration.sourceDirectory, "package.json");
  const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, "utf8"));
  const version = releaseVersion ?? sourceManifest.version;
  const releaseDirectory = join(releaseRootDirectory, configuration.releaseDirectoryName);
  mkdirSync(releaseDirectory, { recursive: true });

  for (const relativePath of sourceManifest.files ?? []) {
    copyPackageFile(configuration.sourceDirectory, releaseDirectory, relativePath);
  }
  for (const conventionalFileName of ["README.md", "LICENSE", "CHANGELOG.md"]) {
    copyPackageFile(configuration.sourceDirectory, releaseDirectory, conventionalFileName);
  }

  const releaseManifest = {
    ...sourceManifest,
    name: configuration.packageName,
    version,
    homepage: FORK_REPOSITORY_WEB_URL,
    bugs: { url: `${FORK_REPOSITORY_WEB_URL}/issues` },
    repository: { type: "git", url: FORK_REPOSITORY_URL },
    bin: normalizeBinPaths(sourceManifest.bin),
    dependencies: rewriteInternalDependencies(sourceManifest.dependencies, version),
  };

  delete releaseManifest.devDependencies;
  delete releaseManifest.scripts;
  writeFileSync(
    join(releaseDirectory, "package.json"),
    `${JSON.stringify(releaseManifest, null, 2)}\n`,
  );
  rewriteCliBinImport(releaseDirectory);
}

console.log(`Prepared fork release packages in ${releaseRootDirectory}`);
