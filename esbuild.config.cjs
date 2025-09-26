const { build } = require("esbuild");
const pkg = require("./package.json");

const versionDefine = { __APP_VERSION__: JSON.stringify(pkg.version) };

const fs = require("fs");
const path = require("path");

const entryPoints = fs
  .readdirSync(path.resolve(__dirname, "src"))
  .filter((f) => f.endsWith(".ts"))
  .map((f) => path.join("src", f));

build({
  entryPoints: entryPoints,
  outdir: "dist/",
  bundle: false,
  platform: "neutral",
  format: "cjs",
  define: versionDefine,
}).catch(() => process.exit(1));
