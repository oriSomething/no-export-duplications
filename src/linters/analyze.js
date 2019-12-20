// @ts-check
"use strict";

//#region Imports
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const parseTsFile = require("../parsers/parse-ts-file");
const parseJsFile = require("../parsers/parse-js-file");
const filterUri = require("../parsers/filter-uri");
//#endregion

/**
 *
 * @param {string}  [rootUri]
 * @param {AnalyzeOptions} [options]
 */
function analyze(rootUri = process.cwd(), options = {}) {
  const ignorepath = (options.ignorepath || []).map(uri => path.resolve(rootUri, uri));
  const rootUriGlopPath = rootUri + (/\/$/.test(rootUri) ? "" : "/") + "**/*.{js,mjs,ts,tsx}";
  const matches = glob.sync(rootUriGlopPath);

  /** @type {Map<string,ParseFileReturn>} */
  const filesExports = new Map();

  //#region Parse
  /**
   * @param {string} uri
   * @param {ParseFileReturn}  exportsData
   */
  function push(uri, exportsData) {
    if (filesExports.has(uri)) {
      throw new Error("Cannot check the same file twice");
    }

    filesExports.set(uri, exportsData);
  }

  matches.filter(filterUri.bind(undefined, ignorepath)).forEach(uri => {
    const code = fs.readFileSync(uri).toString();

    try {
      switch (path.extname(uri)) {
        case ".js":
        case ".mjs":
          push(uri, parseJsFile({ code, uri }));
          break;

        case ".ts":
        case ".tsx":
          push(uri, parseTsFile({ code, uri }));
          break;
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error(`Parsing error of file "${uri}"`);
      }
      throw e;
    }
  });
  //#endregion

  return filesExports;
}

module.exports = analyze;
