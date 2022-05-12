import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import path from "path";
import esbuild from "rollup-plugin-esbuild";
import { terser } from "rollup-plugin-terser";

const createBabelConfig = require("./babel.config");

const extensions = [".ts", ".tsx"];
const { root } = path.parse(process.cwd());

const external = (id) => !id.startsWith(".") && !id.startsWith(root);
const getBabelOptions = (targets) => ({
  ...createBabelConfig({ env: (env) => env === "build" }, targets),
  extensions,
  comments: false,
  babelHelpers: "bundled",
});

const getEsbuild = (target, env = "development") => {
  return esbuild({
    minify: env === "production",
    target,
    tsconfig: path.resolve("./tsconfig.json"),
  });
};

const createDeclarationConfig = (input, outDir) => ({
  input,
  output: { dir: outDir },
  external,
  plugins: [
    typescript({ declaration: true, emitDeclarationOnly: true, outDir }),
  ],
});

const createESMConfig = (input, output) => ({
  input,
  output: [
    { file: `${output}.js`, format: "esm" },
    { file: `${output}.mjs`, format: "esm" },
  ],
  external,
  plugins: [resolve({ extensions }), getEsbuild("node12")],
});

const createCommonJSConfig = (input, output) => ({
  input,
  output: { file: `${output}.js`, format: "cjs", exports: "named" },
  external,
  plugins: [resolve({ extensions }), babel(getBabelOptions({ ie: 11 }))],
});

function createUMDConfig(input, output, env) {
  return {
    input,
    output: {
      file: `${output}.${env}.js`,
      format: "umd",
      exports: "named",
      name: "timsy",
      globals: { react: "react" },
    },
    external,
    plugins: [
      resolve({ extensions }),
      babel(getBabelOptions({ ie: 11 })),
      ...(env === "production" ? [terser()] : []),
    ],
  };
}

function createSystemConfig(input, output, env) {
  return {
    input,
    output: {
      file: `${output}.${env}.js`,
      format: "system",
      exports: "named",
    },
    external,
    plugins: [resolve({ extensions }), getEsbuild("node12", env)],
  };
}

// eslint-disable-next-line import/no-anonymous-default-export
export default function (args) {
  let c = Object.keys(args).find((key) => key.startsWith("config-"));
  if (c) {
    c = c.slice("config-".length).replace(/_/g, "/");
  } else {
    c = "index";
  }

  console.log({ args });
  return [
    ...(c === "index" ? [createDeclarationConfig(`src/${c}.ts`, "dist")] : []),
    createCommonJSConfig(`src/${c}.ts`, `dist/${c}`),
    createESMConfig(`src/${c}.ts`, `dist/esm/${c}`),
    createUMDConfig(`src/${c}.ts`, `dist/umd/${c}`, "development"),
    createUMDConfig(`src/${c}.ts`, `dist/umd/${c}`, "production"),
    createSystemConfig(`src/${c}.ts`, `dist/system/${c}`, "development"),
    createSystemConfig(`src/${c}.ts`, `dist/system/${c}`, "production"),
  ];
}
