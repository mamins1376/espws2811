const { readFileSync, writeFileSync } = require("fs");
const { transformSync } = require("@babel/core");

let preact = readFileSync("node_modules/preact/dist/preact.min.js", "utf8");
preact = preact.substr(0, preact.lastIndexOf(";") + 1);

const app = readFileSync("index.jsx", "utf8");
const options = {
  presets: ["minify"],
  plugins: [
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    ["@babel/plugin-transform-react-jsx", { pragma: "h", pragmaFrag: "Fragment" }]
  ]
};
const transformed = transformSync(app, options);
const result = preact + transformed.code;
writeFileSync("bundle.js", result);
console.log("Minified all javascript codes");
