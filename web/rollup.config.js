import { nodeResolve } from "@rollup/plugin-node-resolve";
import sucrase from "@rollup/plugin-sucrase";
import { terser } from "rollup-plugin-terser";
import html from "@rollup/plugin-html";
import { minify } from "html-minifier";
import scss from "rollup-plugin-scss";

// hack to inject css to html
// scss calls output which sets this
var css;

export default {
  input: "src/index.jsx",
  output: {
    file: "dist/bundle.js",
    format: "iife"
  },
  plugins: [
    scss({
      outputStyle: "compressed",
      output: c => { css = c.slice(0, c.length - (c[-1]==="\n")) }
    }),
    nodeResolve({
      extensions: [".js", ".jsx", ".scss"]
    }),
    sucrase({
      exclude: ["node_modules/**"],
      transforms: ["jsx"],
      production: true,
      jsxPragma: "h",
      jsxFragmentPragma: "Fragment"
    }),
    (!process.env.NO_MINIFY) && terser({
      compress: {
        passes: 3,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true
      },
      mangle: {
        toplevel: true,
        properties: true
      },
      format: {
        semicolons: false
      },
      ecma: 2015,
      toplevel: true
    }),
    html({
      title: "ESPWS2811",
      template: ({ files: { js }, title }) => minify(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${title}</title>
            <link rel="shortcut icon" href="#">
            <style>${css}</style>
          </head>
          <body>
            ${(js || []).map(f => `<script>${f.code}</script>`)}
          </body>
        </html>
      `, {
        collapseWhitespace: true,
        removeComments: true
      })
    })
  ]
}
