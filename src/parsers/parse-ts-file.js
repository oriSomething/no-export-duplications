// @ts-check
"use strict";

//#region Imports
const path = require("path");
const ts = require("typescript");
const toString = require("./ts-utils/to-string");
const hasPrivateJsDocComment = require("./ts-utils/has-private-js-doc-comment");
//#endregion

/**
 * @param  {ParseFileArgs}   args
 * @return {ParseFileReturn}
 */
function parseTsFile({ code, uri }) {
  const file = parse({ code, uri });

  return {
    exports: extractExports(file),
    imports: extractImports(file),
  };
}

module.exports = parseTsFile;

//#region Helpers
/**
 * @param {ParseFileArgs} args
 */
function parse({ code, uri }) {
  const ext = path.extname(uri).toLowerCase();

  const file = ts.createSourceFile(
    uri,
    code,
    ts.ScriptTarget.ESNext,
    // Needed for JSDoc
    /*setParentNodes */ true,
    ext === ".ts" ? ts.ScriptKind.TS : ts.ScriptKind.TSX,
  );

  return file;
}
//#endregion

//#region Main helpers
/**
 * We ignore `import * as Namespace from "···"` imports since it's a "newly"
 * creation of variable like
 * @param {import("typescript").SourceFile} file
 * @returns {ImportData[]}
 */
function extractImports(file) {
  const fileDirname = path.dirname(file.fileName);
  const imports = [];

  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;

    const { importClause, moduleSpecifier } = statement;
    if (importClause == null || !ts.isImportClause(importClause)) continue;
    if (moduleSpecifier == null || !ts.isStringLiteral(moduleSpecifier)) continue;

    const from = moduleSpecifier.text;

    if (importClause.name != null && ts.isIdentifier(importClause.name)) {
      imports.push({
        fileDirname,
        from,
        isDefault: true,
        isRenamed: false,
        name: toString(importClause.name.escapedText),
      });
    }

    if (importClause.namedBindings != null && ts.isNamedImports(importClause.namedBindings)) {
      for (const element of importClause.namedBindings.elements) {
        imports.push({
          fileDirname,
          from,
          isDefault: false,
          isRenamed: element.propertyName != null,
          name: toString(element.name.escapedText),
        });
      }
    }
  }

  return imports;
}

/**
 * We ignore `export * from "···"`, since it's just an alias
 * @param {import("typescript").SourceFile} file
 * @returns {ExportsData}
 */
function extractExports(file) {
  /** @type {ExportsData} */
  const exports = new Map();

  /**
   * @param {string|import("typescript").__String} val
   * @param {import("typescript").Statement} __node
   * @param {number} pos
   * @param {boolean} isPrivate
   */
  function push(val, __node, pos, isPrivate) {
    const loc = file.getLineAndCharacterOfPosition(pos);

    // In TS compiler, lines start at `0`
    const line = loc.line + 1;

    exports.set(toString(val), {
      isPrivate,
      line,
    });
  }

  for (const statement of file.statements) {
    //#region Check if it's an actual export
    const isExported =
      ts.isExportDeclaration(statement) ||
      (statement.modifiers != null && statement.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword));
    if (!isExported) continue;
    //#endregion

    const isPrivate = hasPrivateJsDocComment(statement);

    if (
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement)
    ) {
      if (statement.name != null) {
        push(statement.name.escapedText, statement, statement.name.pos, isPrivate);
      }
    }
    //
    else if (ts.isTypeAliasDeclaration(statement)) {
      /**
       * Preventing calling duplication to export type aliases such as:
       * `export type SomeType = import("···").SomeType`
       */
      if (
        !ts.isImportTypeNode(statement.type) ||
        statement.type.qualifier == null ||
        !ts.isIdentifier(statement.type.qualifier) ||
        statement.type.qualifier.escapedText !== statement.name.escapedText
      ) {
        push(statement.name.escapedText, statement, statement.name.pos, isPrivate);
      }
    }
    //
    else if (ts.isVariableStatement(statement)) {
      for (let declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          push(declaration.name.escapedText, statement, declaration.pos, isPrivate);
        }
      }
    }
    //
    else if (ts.isExportDeclaration(statement)) {
      if (
        // ts.isNamedExports(statement.exportClause) &&
        statement.exportClause != null &&
        statement.exportClause.elements != null &&
        Array.isArray(statement.exportClause.elements) &&
        // If `s.moduleSpecifier == null` it means it's `export { Something } from "other module"` which isn't duplicated symbol
        // TODO: export { A as B } from "..."

        statement.moduleSpecifier == null
      ) {
        for (let element of statement.exportClause.elements) {
          push(element.name.escapedText, statement, element.pos, isPrivate);
        }
      }
    }
  }

  return exports;
}
//#endregion
