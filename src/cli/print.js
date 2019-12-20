// @ts-check
/* eslint-disable no-console */
"use strict";

//#region Import
const chalk = require("chalk");
//#endregion

//#region Types
/**
 * @typedef  {Object} DuplicatedExport
 * @property {string} identifier - The name of the "exported symbol"
 * @property {DuplicatedExportExports[]} exports
 */

/**
 * @typedef  {Object} DuplicatedExportExports
 * @property {string} uri - The absolute path of the filename
 * @property {number} line
 */
//#endregion

/**
 * @param {DuplicatedExport[]} duplications
 */
function print(duplications) {
  if (duplications.length === 0) {
    console.log("No duplications");
  } else {
    const strings = duplications.map(duplication => {
      const filesList = duplication.exports
        .map(({ uri, line }) => {
          return chalk`    {gray.underline ${uri}:${line}}`;
        })
        .join("\n");

      return chalk`🚫   {white ${duplication.identifier}}\n${filesList}\n`;
    });

    console.error([chalk`{yellow.bold Duplications:}`, "", ...strings, ""].join("\n"));
  }
}

module.exports = print;
