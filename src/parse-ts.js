// @ts-check
/* eslint-disable no-console */
"use strict";

const ts = require("typescript");

/** @typedef {import("typescript").__String} __String
/** @typedef {import("typescript").ClassDeclaration} ClassDeclaration
/** @typedef {import("typescript").EnumDeclaration} EnumDeclaration
/** @typedef {import("typescript").ExportDeclaration} ExportDeclaration
/** @typedef {import("typescript").FunctionDeclaration} FunctionDeclaration
/** @typedef {import("typescript").Identifier} Identifier
/** @typedef {import("typescript").InterfaceDeclaration} InterfaceDeclaration
/** @typedef {import("typescript").Statement} Statement
/** @typedef {import("typescript").SyntaxKind} SyntaxKind
/** @typedef {import("typescript").TypeAliasDeclaration} TypeAliasDeclaration
/** @typedef {import("typescript").VariableStatement} VariableStatement

/**
 * @param   {{ code: string, uri: string }} args
 * @returns {Map.<string,{ line: number }>}
 */
function parseTs({ code, uri }) {
  /**
   * @type {Map.<string,{ line: number }>}
   */
  const exportsData = new Map();
  /**
   * Because `--isolatedModules` flag we need to manually re-export bindings. So we ignore them
   * @type {Set.<string>}
   */
  const ignoredExportsOfImports = new Set();

  const file = ts.createSourceFile(uri, code, ts.ScriptTarget.ESNext, /*setParentNodes */ false);

  /**
   * @param {string|__String} val
   * @param {Statement} node
   */
  function push(val, node) {
    if (ignoredExportsOfImports.has(toString(val))) {
      return;
    }

    const loc = file.getLineAndCharacterOfPosition(node.pos);

    exportsData.set(toString(val), {
      // In TS compiler, lines start at `0`
      line: loc.line + 1,
    });
  }

  /**
   * Process
   */

  file.statements.forEach(statement => {
    // if (statement.kind === ts.SyntaxKind.ImportDeclaration) {
    if (ts.isImportDeclaration(statement)) {
      if (
        statement.importClause != null &&
        statement.importClause.namedBindings != null &&
        // Was: Array.isArray(statement.importClause.namedBindings.elements)
        ts.isNamedImports(statement.importClause.namedBindings)
      ) {
        statement.importClause.namedBindings.elements.forEach(element => {
          if (element.propertyName != null) {
            ignoredExportsOfImports.add(toString(element.propertyName.escapedText));
          } else {
            ignoredExportsOfImports.add(toString(element.name.escapedText));
          }
        });
      }
    }
  });

  file.statements
    .filter(s => {
      if (s.kind === ts.SyntaxKind.ExportDeclaration) {
        return true;
      }

      if (Array.isArray(s.modifiers)) {
        return s.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      }

      return false;
    })
    .forEach(statement => {
      switch (statement.kind) {
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.EnumDeclaration:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.InterfaceDeclaration:
          {
            const s = /** @type {ClassDeclaration|EnumDeclaration|FunctionDeclaration|InterfaceDeclaration} */ (statement);

            if (s.name != null) {
              push(s.name.escapedText, statement);
            }
          }
          break;

        case ts.SyntaxKind.TypeAliasDeclaration:
          {
            const s = /** @type {TypeAliasDeclaration} */ (statement);

            /**
             * Preventing calling duplication to export type aliases such as:
             * `export type SomeType = import("···").SomeType`
             */
            if (
              !ts.isImportTypeNode(s.type) ||
              !ts.isIdentifier(s.type.qualifier) ||
              s.type.qualifier.escapedText !== s.name.escapedText
            ) {
              push(s.name.escapedText, statement);
            }
          }
          break;

        case ts.SyntaxKind.VariableStatement:
          {
            const s = /** @type {VariableStatement} */ (statement);
            for (let declaration of s.declarationList.declarations) {
              if (ts.isIdentifier(declaration.name)) {
                push(declaration.name.escapedText, statement);
              }
            }
          }
          break;

        case ts.SyntaxKind.ExportDeclaration:
          {
            const s = /** @type {ExportDeclaration} */ (statement);
            if (
              s.exportClause != null &&
              Array.isArray(s.exportClause.elements) &&
              // If `s.moduleSpecifier == null` it means it's `export { Something } from "other module"` which isn't duplicated symbol
              s.moduleSpecifier == null
            ) {
              for (let element of s.exportClause.elements) {
                push(element.name.escapedText, statement);
              }
            }
          }

          break;

        default:
          console.dir(statement, { depth: 0, colors: true });
          throw new Error(`statement of kind ${getNodeName(statement.kind)} isn't supported`);
      }
    });

  return exportsData;
}

module.exports = parseTs;

//#region Helpers
/**
 * @param {SyntaxKind} kind
 */
function getNodeName(kind) {
  for (var k of Object.keys(ts.SyntaxKind)) {
    if (ts.SyntaxKind[k] === kind) {
      return k;
    }
  }

  return kind;
}

/**
 * @param {string|__String} str
 */
function toString(str) {
  return /** @type {string} */ (str);
}
//#endregion
