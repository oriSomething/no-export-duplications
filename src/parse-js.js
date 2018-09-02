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
];

const babylon = require("@babel/parser");

/**
 * @param   {{ code: string, uri: string }} args
 * @returns {Map.<string,{ line: number }>}
 */
function parseJs({ code }) {
  /**
   * @type {Map.<string,*>}
   */
  const exportsData = new Map();
  const file = babylon.parse(code, {
    sourceType: "module",
    plugins: BABYLON_PLUGINS,
  });

  const push = (val, node) => {
    exportsData.set(val, {
      line: node.loc.start.line,
    });
  };

  /**
   * Process
   */

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
              push(node.name, node);
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
          node.declarations.forEach(node => push(node.id.name, node));
          break;
        case "FunctionDeclaration":
        case "ClassDeclaration":
          push(node.id.name, node);
          break;

        // Types (Flow only)
        case "TypeAlias":
        case "InterfaceDeclaration":
          push(node.id.name, node);
          break;

        // Yet supported
        default:
          throw new Error(`${node.type} isn't supported`);
      }
    });

  return exportsData;
}

module.exports = parseJs;
