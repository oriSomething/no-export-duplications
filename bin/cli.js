#!/usr/bin/env node
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

require("../src/index.js")(argv._[0], {
  whitelist: argv.w,
  ignorepath: argv.i,
});
