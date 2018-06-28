/* eslint-disable no-console */
"use strict";

const ts = require("typescript");

/**
 * @param   {{ code: string, uri: string }} args
 * @returns {Map.<string,{ line: number }>}
 */
function parseTs({ code, uri }) {
  /**
   * @type {Map.<string,{ line: number }>}
   */
  const exportsData = new Map();
  const file = ts.createSourceFile(uri, code, ts.ScriptTarget.ESNext, /*setParentNodes */ false);

  const push = (val, node) => {
    const loc = file.getLineAndCharacterOfPosition(node.pos);

    exportsData.set(val, {
      // In TS compiler, lines start at `0`
      line: loc.line + 1,
    });
  };

  /**
   * Process
   */

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
        case ts.SyntaxKind.TypeAliasDeclaration:
          push(statement.name.escapedText, statement);
          break;

        case ts.SyntaxKind.VariableStatement:
          for (let declaration of statement.declarationList.declarations) {
            push(declaration.name.escapedText, statement);
          }
          break;

        case ts.SyntaxKind.ExportDeclaration:
          if (statement.exportClause != null && Array.isArray(statement.exportClause.elements)) {
            for (let element of statement.exportClause.elements) {
              push(element.name.escapedText, statement);
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

/**
 * Helpers
 */

function getNodeName(kind) {
  for (var k of Object.keys(ts.SyntaxKind)) {
    if (ts.SyntaxKind[k] === kind) {
      return k;
    }
  }

  return kind;
}
