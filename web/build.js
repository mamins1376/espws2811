const { readFileSync, writeFileSync } = require("fs");
const { transformSync } = require("@babel/core");
const { minify } = require("terser");

let preact = readFileSync("node_modules/preact/dist/preact.min.js", "utf8");
preact = preact.substr(0, preact.lastIndexOf(";") + 1);

const app = readFileSync("index.jsx", "utf8");
const transformed = transformSync(app, {
  plugins: [
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    ["@babel/plugin-transform-react-jsx", { pragma: "h", pragmaFrag: "Fragment" }]
  ]
});

minify(transformed.code, {
  compress: {
    unsafe: true,
    unsafe_arrows: true,
    unsafe_methods: true,
    unsafe_proto: true
  },
  ecma: 2015,
  module: true
}).then(minified => {
  writeFileSync("bundle.js", preact + minified.code);
  console.log("Minified all javascript codes");
}).catch(e => { throw e; });
