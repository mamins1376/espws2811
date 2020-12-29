import { nodeResolve } from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import sourcemaps from "rollup-plugin-sourcemaps";
import scss from "rollup-plugin-scss";
import sucrase from "@rollup/plugin-sucrase";
import html from "@rollup/plugin-html";
import { minify } from "html-minifier";
import { minify as terser } from "terser";

const terserOptions = {
  compress: {
    passes: 3
  },
  ecma: 2015
};

// hack to inject css to html
// scss calls output which sets this
var css;

const template = js => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>ESPWS2811</title>
      <link rel="shortcut icon" href="#">
      <style>${css}</style>
    </head>
    <body>${js}</body>
  </html>
`;

export default {
  input: "web/index.jsx",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    sourcemap: true
  },
  plugins: [
    alias({ entries: [
      { find: "react", replacement: "preact/compat" },
      { find: "react-dom", replacement: "preact/compat" }
    ]}),
    nodeResolve({
      extensions: [".js", ".jsx", ".scss"]
    }),
    scss({
      outputStyle: "compressed",
      output: c => { css = c.slice(0, c.length - (c[-1]==="\n")) }
    }),
    sucrase({
      exclude: ["node_modules/**"],
      transforms: ["jsx"],
      production: true,
      jsxPragma: "h",
      jsxFragmentPragma: "Fragment"
    }),
    sourcemaps(),
    html({
      template: ({ files: { js } }) =>
        template(js.map(({ fileName: n }) => `<script src="${n}"></script>`).join(""))
    }),
    html({
      fileName: "embed.html",
      template: async ({ files: { js } }) => minify(
        template((await Promise.all(js.map(async ({ code }) => `<script>${
          (await terser(code, terserOptions)).code
        }</script>`))).join("")),
        { collapseWhitespace: true, removeComments: true }
      )
    })
  ]
}
