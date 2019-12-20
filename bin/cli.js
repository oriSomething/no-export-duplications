#!/usr/bin/env node
// @ts-check
"use strict";

const yargs = require("yargs");

const argv = yargs
  .strict()
  .nargs("uri", 1)
  .usage("$0 <path> [option]")
  //
  .alias("w", "whitelist")
  .describe("w", "Allow duplicated export")
  .array("w")
  //
  .alias("i", "ignorepath")
  .describe("i", "Ignore paths")
  .array("i").argv;

const rootUri = argv._[0] || process.cwd();
/** @type {*} */
const whitelist = argv.w;
/** @type {*} */
const ignorepath = argv.i;

require("../src/cli")(rootUri, {
  whitelist,
  ignorepath,
});
