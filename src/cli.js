// @ts-check
"use strict";

//#region Imports
const analyze = require("./linters/analyze");
const check = require("./linters/check");
const print = require("./cli/print");
//#endregion

//#region Types
/**
 * @typedef {Object} Options
 * @property {Array.<string>} [whitelist]
 * @property {Array.<string>} [ignorepath]
 */
//#endregion

/**
 * @param {string} [rootUri]
 * @param {Options} options
 */
function cli(rootUri = process.cwd(), options) {
  const exportsImports = analyze(rootUri, {
    ignorepath: options.ignorepath,
  });

  const result = check(exportsImports, {
    whitelist: options.whitelist,
  });

  const duplications = [];

  for (let [identifier, exports] of result) {
    duplications.push({
      identifier,
      exports,
    });
  }

  print(duplications);
}

module.exports = cli;
