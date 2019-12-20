// @ts-check
"use strict";

//#region Imports
const minimatch = require("minimatch");
//#endregion

/**
 * @param   {string[]} ignorepath
 * @param   {string}   uri
 * @returns {boolean}
 */
function filterUri(ignorepath, uri) {
  return !(
    //#region Defaults
    (
      /\.test\.(js|mjs|ts|tsx)$/.test(uri) ||
      /\.spec\.(js|mjs|ts|tsx)$/.test(uri) ||
      uri.endsWith(".d.ts") ||
      uri.endsWith(".flow") ||
      uri.includes("node_modules") ||
      uri.includes("flow-typed") ||
      uri.includes("/dist/") ||
      uri.includes("/build/") ||
      //#endregion
      ignorepath.some(u => minimatch(uri, u)) ||
      false
    )
  );
}

module.exports = filterUri;
