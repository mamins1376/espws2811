import { nodeResolve } from "@rollup/plugin-node-resolve";
import sucrase from "@rollup/plugin-sucrase";
import { terser } from "rollup-plugin-terser";

export default {
  input: "index.jsx",
  output: {
    file: "bundle.js",
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
    terser({
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
    })
  ]
}
