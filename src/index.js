/* eslint-disable no-console */
"use strict";

/**
 * @typedef {Object} Options
 * @property {Array.<string>} [whitelist]
 * @property {Array.<string>} [ignorepath]
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");
const minimatch = require("minimatch");
const chalk = require("chalk");
const parseJs = require("./parse-js");
const parseTs = require("./parse-ts");

/**
 * @param {string} [rootUri]
 * @param {Options} options
 */
function main(rootUri = process.cwd(), options = {}) {
  const ignorepath = (options.ignorepath || []).map(uri => path.resolve(rootUri, uri));
  const whitelist = new Set(options.whitelist);
  const rootUriGlopPath = rootUri + (/\/$/.test(rootUri) ? "" : "/") + "**/*.{js,mjs,ts,tsx}";
  const matches = glob.sync(rootUriGlopPath);
  const usedExports = new Map();
  const duplicationsExports = new Map();

  /**
   * @param {Map.<string,{ uri: string, line: number }>}  exportsData
   * @param {string} uri
   */
  const push = (exportsData, uri) => {
    for (let [name, meta] of exportsData.entries()) {
      if (whitelist.has(name)) continue;

      const data = {
        uri,
        line: meta.line,
      };

      if (usedExports.has(name)) {
        if (duplicationsExports.has(name)) {
          duplicationsExports.get(name).push(uri);
        } else {
          duplicationsExports.set(name, [usedExports.get(name), data]);
        }
      } else {
        usedExports.set(name, data);
      }
    }
  };

  matches.filter(filterUri.bind(undefined, ignorepath)).forEach(uri => {
    const code = fs.readFileSync(uri).toString();

    // const fileNameWithoutExtension = path.basename(uri, path.extname(uri));
    // const absoluteUri = path.resolve(uri);

    try {
      switch (path.extname(uri)) {
        case ".js":
        case ".mjs":
          push(parseJs({ code, uri }), uri);
          break;

        case ".ts":
        case ".tsx":
          push(parseTs({ code, uri }), uri);
          break;
      }
    } catch (e) {
      console.error(`Parsing error of file "${uri}"`);
      throw e;
    }
  });

  if (duplicationsExports.size === 0) {
    console.log("No duplications");
  } else {
    const duplications = [...duplicationsExports].map(([identifier, duplications]) => {
      const filesList = duplications
        .map(({ uri, line }) => {
          return chalk`    {gray.underline ${uri}:${line}}`;
        })
        .join("\n");

      return chalk`🚫   {white ${identifier}}\n${filesList}\n`;
    });
    console.error([chalk`{yellow.bold Duplications:}`, "", ...duplications, ""].join("\n"));
    process.exit(1);
  }
}

/**
 * @param {Array.<string>} ignorepath
 * @param {string} uri
 * @returns {boolean}
 */
function filterUri(ignorepath, uri) {
  return !(
    /\.test\.(js|mjs|ts|tsx)$/.test(uri) ||
    /\.spec\.(js|mjs|ts|tsx)$/.test(uri) ||
    /\.d\.ts$/.test(uri) ||
    /\.flow$/.test(uri) ||
    uri.includes("node_modules") ||
    uri.includes("flow-typed") ||
    uri.includes("/dist/") ||
    uri.includes("/build/") ||
    ignorepath.some(u => minimatch(uri, u)) ||
    false
  );
}

if (require.main === module) {
  main();
} else {
  module.exports = main;
}
