// Stamp shipped assets, including lazy-loaded images, without a build dependency.
const { createHash } = require("node:crypto");
const { readFileSync, readdirSync, writeFileSync } = require("node:fs");
const { join, relative } = require("node:path");
const root = join(__dirname, "..");
const files = ["index.html", "manifest.json"];
for (const dir of ["css", "fonts", "icons", "images", "js"]) {
  for (const entry of readdirSync(join(root, dir), { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) files.push(relative(root, join(entry.parentPath, entry.name)).replaceAll("\\", "/"));
  }
}
const hash = createHash("sha256");
for (const file of files.sort()) {
  let bytes = readFileSync(join(root, file));
  if (/\.(?:html|js|css|json|svg|txt)$/i.test(file)) bytes = Buffer.from(bytes.toString().replace(/\r\n/g, "\n"));
  hash.update(`${file}\0${bytes.length}\0`).update(bytes);
}
const version = `ngesrep-v${hash.digest("hex").slice(0, 16)}`;
const path = join(root, "sw.js");
const sw = readFileSync(path, "utf8");
const stamp = /^const CACHE_VERSION = "[^"]+";/;
if (!stamp.test(sw)) throw new Error("CACHE_VERSION missing from sw.js");
const updated = sw.replace(stamp, `const CACHE_VERSION = "${version}";`);
if (sw !== updated) {
  if (!process.argv.includes("--write")) throw new Error("Stale offline cache: run npm run build:css");
  writeFileSync(path, updated);
}
