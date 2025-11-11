const { build } = require("esbuild");
const pkg = require("./package.json");

const versionDefine = { __APP_VERSION__: JSON.stringify(pkg.version) };

function collectTsFiles(dir, exts = [".ts", ".tsx"]) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git", "__tests__"].includes(entry.name))
        continue; // optional ignores
      results.push(...collectTsFiles(full, exts));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (exts.includes(ext) && !entry.name.endsWith(".d.ts"))
        results.push(full);
    }
  }
  return results;
}

const fs = require("fs");
const path = require("path");

const srcDir = path.resolve(__dirname, "src");
const entryPoints = collectTsFiles(srcDir); // absolute paths are fine

build({
  entryPoints: entryPoints,
  outdir: "dist/",
  bundle: false,
  platform: "neutral",
  format: "cjs",
  define: versionDefine,
}).catch(() => process.exit(1));
