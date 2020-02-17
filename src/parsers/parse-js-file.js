// @ts-check
// spellchecker:ignore nullish
"use strict";

//#region Imports
const path = require("path");
const babylon = require("@babel/parser");
const t = require("@babel/types");
//#endregion

/**
 * @param  {ParseFileArgs}   args
 * @return {ParseFileReturn}
 */
function parseTsFile({ code, uri }) {
  const file = parse({ code, uri });

  return {
    exports: extractExports(file, uri),
    imports: extractImports(file, uri),
  };
}

module.exports = parseTsFile;

//#region Helpers
/**
 * @param {ParseFileArgs} args
 */
function parse({ code, uri }) {
  const file = babylon.parse(code, {
    sourceFilename: uri,
    sourceType: "module",
    plugins: [
      "asyncGenerators",
      "bigInt",
      "classPrivateMethods",
      "classPrivateProperties",
      "classProperties",
      "dynamicImport",
      "flow",
      "importMeta",
      "jsx",
      "nullishCoalescingOperator",
      "numericSeparator",
      "objectRestSpread",
      "optionalCatchBinding",
      "optionalChaining",
      "throwExpressions",
      "topLevelAwait",
    ],
  });

  return file;
}
//#endregion

//#region Main helpers
/**
 * We ignore `import * as Namespace from "···"` imports since it's a "newly"
 * creation of variable like
 * @param {t.File} file
 * @param {string} uri
 * @returns {ImportData[]}
 */
function extractImports(file, uri) {
  const fileDirname = path.dirname(uri);
  const imports = [];

  for (const statement of file.program.body) {
    if (!t.isImportDeclaration(statement)) continue;

    const from = statement.source.value;

    for (let specifier of statement.specifiers) {
      // `import x from ""`
      if (t.isImportDefaultSpecifier(specifier)) {
        imports.push({
          fileDirname,
          from,
          isDefault: true,
          isRenamed: false,
          name: specifier.local.name,
        });
      }

      // `import { x } from ""`
      else if (t.isImportSpecifier(specifier)) {
        imports.push({
          fileDirname,
          from,
          isDefault: false,
          isRenamed: specifier.imported.name !== specifier.local.name,
          name: specifier.local.name,
        });
      }
    }
  }

  return imports;
}

/**
 * We ignore `export * from "···"`, since it's just an alias
 * @param {t.File} file
 * @param {string} __uri
 * @returns {ExportsData}
 */
function extractExports(file, __uri) {
  /** @type {ExportsData} */
  const exports = new Map();

  /**
   * @param {string} val
   * @param {import("@babel/types").Node} node
   * @param {boolean} isPrivate
   */
  function push(val, node, isPrivate) {
    if (node.loc == null) {
      throw new TypeError("Node has no location");
    }

    exports.set(val, {
      isPrivate,
      line: node.loc.start.line,
    });
  }

  for (let node of file.program.body) {
    if (!t.isExportNamedDeclaration(node) && !t.isExportDefaultDeclaration(node)) {
      continue;
    }

    if (t.isDeclaration(node)) {
      const declaration = node.declaration;

      // NOTE: "export {···} from '···'"
      if (declaration == null) {
        if (t.isExportNamedDeclaration(node)) {
          for (let specifier of node.specifiers) {
            if (t.isExportSpecifier(specifier)) {
              // TODO: "export { A as B } from '···'"
              if (node.source != null) continue;

              push(specifier.exported.name, specifier.exported, hasPrivateJsDoc(node.leadingComments));
              continue;
            }

            if (t.isExportDefaultSpecifier(specifier)) {
              throw new Error("TODO ExportDefaultSpecifier");
            } else if (t.isExportNamespaceSpecifier(specifier)) {
              throw new Error("TODO ExportNamespaceSpecifier");
            }
          }
        }
      } // NOTE: All other kind of exports
      else if (t.isVariableDeclaration(declaration)) {
        declaration.declarations.forEach(declaration => {
          if (t.isIdentifier(declaration.id)) {
            push(declaration.id.name, declaration, hasPrivateJsDoc(node.leadingComments));
          }
        });
      } else if (t.isFunctionDeclaration(declaration)) {
        if (declaration.id != null) {
          push(declaration.id.name, declaration, hasPrivateJsDoc(node.leadingComments));
        }
      } else if (t.isClassDeclaration(declaration)) {
        push(declaration.id.name, declaration, hasPrivateJsDoc(node.leadingComments));
      }

      // Types (Flow only)
      else if (t.isTypeAlias(declaration) || t.isInterfaceDeclaration(declaration)) {
        push(declaration.id.name, declaration, hasPrivateJsDoc(node.leadingComments));
      }

      // Unsupported types yet
      else {
        throw new Error(`${declaration.type} isn't supported`);
      }
    }
  }

  return exports;
}
//#endregion

//#region Parse helpers
/**
 * @param {ReadonlyArray<import("@babel/types").Comment>|null} node
 * @return {boolean}
 */
function hasPrivateJsDoc(node) {
  return Array.isArray(node) && node.some(comment => comment.value.includes("@private"));
}
//#endregion
