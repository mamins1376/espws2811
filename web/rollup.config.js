import { nodeResolve } from "@rollup/plugin-node-resolve";
import sucrase from "@rollup/plugin-sucrase";
import { terser } from "rollup-plugin-terser";
import html from "@rollup/plugin-html";
import { minify } from "html-minifier";

export default {
  input: "src/index.jsx",
  output: {
    file: "dist/bundle.js",
    format: "iife"
  },
  plugins: [
    nodeResolve({
      extensions: [".js", ".jsx"]
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
      template: ({ files: { css, js }, title }) => minify(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${title}</title>
            <link rel="shortcut icon" href="#">
            ${(css || []).map(f => `<style>${f.code}</style>`)}
          </head>
          <body>
            ${(js  || []).map(f => `<script>${f.code}</script>`)}
          </body>
        </html>
      `, {
        collapseWhitespace: true,
        removeComments: true
      })
    })
  ]
}
