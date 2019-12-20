// @ts-check
"use strict";

//#region Types
/**
 *
 * @typedef  {Object} Data
 * @property {string} uri
 * @property {number} line
 */
//#endregion

/**
 * @param {Map<string,ParseFileReturn>} filesExports
 * @param {CheckOptions} [options]
 */
function check(filesExports, options = {}) {
  const whitelist = new Set(options.whitelist);
  /** @type {Map<string, Data[]>} */
  const duplicationsExports = new Map();
  /** @type {Map<string, Data>} */
  const usedExports = new Map();

  for (let [uri, fileExports] of filesExports.entries()) {
    const localImportsToIgnore = new Set(
      fileExports.imports
        .filter(i => {
          // 1. No good plan how to support default import naming
          // 2. If import is "renamed", it counted as a "new symbol" when exported
          return !i.isDefault && !i.isRenamed;
        })
        .map(i => i.name),
    );

    for (let [exportName, meta] of fileExports.exports) {
      if (whitelist.has(exportName)) continue;
      if (localImportsToIgnore.has(exportName)) continue;

      const data = {
        uri,
        line: meta.line,
      };

      const usedExport = usedExports.get(exportName);

      if (usedExport === undefined) {
        usedExports.set(exportName, data);
      } else {
        const duplicationsExport = duplicationsExports.get(exportName);

        if (duplicationsExport === undefined) {
          duplicationsExports.set(exportName, [usedExport, data]);
        } else {
          duplicationsExport.push(data);
        }
      }
    }
  }

  return duplicationsExports;
}

module.exports = check;
