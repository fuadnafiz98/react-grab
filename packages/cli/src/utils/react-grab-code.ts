import { REACT_GRAB_PACKAGE_NAME } from "./constants.js";
import { escapeRegExp } from "./escape-reg-exp.js";

export const REACT_GRAB_PACKAGE_PATTERN = [REACT_GRAB_PACKAGE_NAME, "react-grab"]
  .filter(
    (packageName, packageIndex, packageNames) => packageNames.indexOf(packageName) === packageIndex,
  )
  .map(escapeRegExp)
  .join("|");

export const REACT_GRAB_SPECIFIER_PATTERN = String.raw`(?:${REACT_GRAB_PACKAGE_PATTERN})(?:\/[^"']+)?`;

const stripComments = (content: string): string =>
  content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");

const stripTypeOnlyReactGrabImports = (content: string): string => {
  return content
    .replace(
      new RegExp(
        String.raw`import\s+type\s+[^;]+from\s+["']${REACT_GRAB_SPECIFIER_PATTERN}["'];?`,
        "g",
      ),
      "",
    )
    .replace(
      new RegExp(
        String.raw`import\s*\{\s*type\s+[^,}]+(?:\s*,\s*type\s+[^,}]+)*\s*,?\s*\}\s*from\s+["']${REACT_GRAB_SPECIFIER_PATTERN}["'];?`,
        "g",
      ),
      "",
    );
};

export const hasReactGrabSetupCode = (content: string): boolean => {
  const setupCandidateContent = stripTypeOnlyReactGrabImports(stripComments(content));
  const setupPatterns = [
    new RegExp(String.raw`import\s*\(\s*["']${REACT_GRAB_SPECIFIER_PATTERN}["']\s*\)`),
    new RegExp(
      String.raw`import\s+(?!type\b)(?:[^"';]+from\s+)?["']${REACT_GRAB_SPECIFIER_PATTERN}["']`,
    ),
    new RegExp(String.raw`require\s*\(\s*["']${REACT_GRAB_SPECIFIER_PATTERN}["']\s*\)`),
    /<Script[\s\S]*?src\s*=\s*(?:["'][^"']*react-grab[^"']*["']|\{(?:["'][^"']*react-grab[^"']*["']|`[^`]*react-grab[^`]*`)\})/i,
    /<script[\s\S]*?src\s*=\s*["'][^"']*react-grab[^"']*["']/i,
  ];

  return setupPatterns.some((pattern) => pattern.test(setupCandidateContent));
};
