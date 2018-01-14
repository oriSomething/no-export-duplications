/* eslint-disable no-console */
"use strict";

const BABYLON_PLUGINS = [
  "asyncGenerators",
  "bigInt",
  "classProperties",
  "dynamicImport",
  "flow",
  "jsx",
  "numericSeparator",
  "objectRestSpread",
  "optionalCatchBinding",
  "throwExpressions",
  "typescript",
];

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const babylon = require("babylon");
const chalk = require("chalk");

function main(rootUri = process.cwd(), options = {}) {
  const whitelist = new Set(options.whitelist);
  const rootUriGlopPath = rootUri + (/\/$/.test(rootUri) ? "" : "/") + "**/*.js";
  const matches = glob.sync(rootUriGlopPath);
  const usedExports = new Map();
  const duplicationsExports = new Map();

  const push = (val, uri, node) => {
    if (whitelist.has(val)) {
      return;
    }

    if (usedExports.has(val)) {
      if (duplicationsExports.has(val)) {
        duplicationsExports.get(val).push(uri);
      } else {
        duplicationsExports.set(val, [usedExports.get(val), { uri, node }]);
      }
    } else {
      usedExports.set(val, { uri, node });
    }
  };

  matches.filter(filterUri).forEach(uri => {
    const code = fs.readFileSync(uri).toString();

    // eslint-disable-next-line
    const fileNameWithoutExtension = path.basename(uri, path.extname(uri));

    const absoluteUri = path.resolve(uri);

    try {
      var file = babylon.parse(code, {
        sourceType: "module",
        plugins: BABYLON_PLUGINS,
      });
    } catch (e) {
      console.error(`Parsing error of file "${uri}"`);
      throw e;
    }

    const namedExports = file.program.body.filter(node => node.type === "ExportNamedDeclaration");

    // NOTE: "export {···} from '···'"
    namedExports
      .filter(node => node.declaration == null)
      .map(node => node.specifiers)
      .forEach(specifiers => {
        specifiers
          // We case only about renamed exports
          .filter(node => node.local.name !== node.exported.name)
          .map(exportSpecifier => exportSpecifier.exported)
          .forEach(node => {
            switch (node.type) {
              case "Identifier":
                push(node.name, absoluteUri, node);
                break;

              // Yet supported
              default:
                throw new Error(`${node.type} isn't supported`);
            }
          });
      });

    // NOTE: All other kind of exports
    namedExports
      .filter(node => node.declaration != null)
      .map(node => node.declaration)
      .forEach(node => {
        switch (node.type) {
          case "VariableDeclaration":
            node.declarations.forEach(node => push(node.id.name, absoluteUri, node));
            break;
          case "FunctionDeclaration":
          case "ClassDeclaration":
            push(node.id.name, absoluteUri, node);
            break;

          // Types (Flow only)
          case "TypeAlias":
          case "InterfaceDeclaration":
            push(node.id.name, absoluteUri, node);
            break;

          // Yet supported
          default:
            throw new Error(`${node.type} isn't supported`);
        }
      });
  });

  if (duplicationsExports.size === 0) {
    console.log("No duplications");
  } else {
    const duplications = [...duplicationsExports].map(([identifier, duplications]) => {
      const filesList = duplications
        .map(({ uri, node }) => {
          return chalk`    {gray.underline ${uri}:${node.loc.start.line}}`;
        })
        .join("\n");

      return chalk`🚫   {white ${identifier}}\n${filesList}\n`;
    });
    console.error([chalk`{yellow.bold Duplications:}`, "", ...duplications, ""].join("\n"));
    process.exit(1);
  }
}

function filterUri(uri) {
  return !(
    uri.endsWith(".test.js") ||
    uri.includes("node_modules") ||
    uri.includes("flow-typed") ||
    uri.includes("/dist/") ||
    uri.includes("/build/") ||
    false
  );
}

if (require.main === module) {
  main();
} else {
  module.exports = main;
}
