import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const output = resolve(root, "app-dist");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "assets"), { recursive: true });

await copyFile(resolve(root, "index.html"), resolve(output, "index.html"));
await copyFile(resolve(root, "styles.css"), resolve(output, "styles.css"));
await cp(resolve(root, "src"), resolve(output, "src"), { recursive: true });

for (const asset of ["favicon.ico", "logo-64.png", "logo-256.png"]) {
  await copyFile(resolve(root, "assets", asset), resolve(output, "assets", asset));
}

console.log(`Desktop frontend prepared at ${output}`);
