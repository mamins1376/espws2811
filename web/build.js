const { readFileSync, writeFileSync } = require("fs");
const { minify } = require("terser");

async function main() {
  const code = [ "node_modules/preact/dist/preact.min.js", "js/index.js" ]
    .reduce((m, f) => (m[f] = readFileSync(f, "utf8"), m), {});
  const options = {
    toplevel: true
  };
  const minified = await minify(code, options);
  writeFileSync("bundle.js", minified.code);
  console.log("Minified all javascript codes");
}

main().catch(err => {
  console.log("An error occured:", err);
  process.exitCode = 1;
});
