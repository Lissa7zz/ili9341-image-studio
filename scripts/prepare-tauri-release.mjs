import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const version = packageJson.version;
const targetDir = resolve(root, "src-tauri", "target", "release");
const outputDir = resolve(root, "release-assets");

async function findFiles(directory, extension) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findFiles(path, extension)));
    } else if (extname(entry.name).toLowerCase() === extension) {
      results.push(path);
    }
  }
  return results;
}

const portable = resolve(targetDir, "pixel2panel.exe");
await stat(portable);

const msiFiles = await findFiles(resolve(targetDir, "bundle", "msi"), ".msi");
const setupFiles = await findFiles(resolve(targetDir, "bundle", "nsis"), ".exe");
if (msiFiles.length === 0 || setupFiles.length === 0) {
  throw new Error("Expected MSI and NSIS bundles were not generated");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const outputs = [
  {
    source: portable,
    name: `Pixel2Panel_${version}_x64_portable.exe`,
  },
  {
    source: msiFiles[0],
    name: `Pixel2Panel_${version}_x64.msi`,
  },
  {
    source: setupFiles[0],
    name: `Pixel2Panel_${version}_x64_setup.exe`,
  },
];

const sums = [];
for (const output of outputs) {
  const destination = resolve(outputDir, output.name);
  await copyFile(output.source, destination);
  const digest = createHash("sha256").update(await readFile(destination)).digest("hex");
  sums.push(`${digest}  ${basename(destination)}`);
}

await writeFile(resolve(outputDir, "SHA256SUMS.txt"), `${sums.join("\n")}\n`, "ascii");
console.log(outputs.map((output) => output.name).join("\n"));
console.log(`SHA256SUMS.txt`);
