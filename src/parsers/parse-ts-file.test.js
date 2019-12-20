// @ts-check
"use strict";

//#region Imports
const path = require("path");
const fs = require("fs");
const parseTsFile = require("./parse-ts-file");
//#endregion

describe("parseTsFile()", function() {
  test("Sanity", function() {
    const testUri = "/ori/__fixtures__/sanity-ts.ts";
    const fileDirname = "/ori/__fixtures__";

    const result = parseTsFile({
      code: fs.readFileSync(path.resolve(__dirname, "../__fixtures__/sanity-ts.ts")).toString(),
      uri: testUri,
    });

    expect(result.imports).toEqual(
      expect.arrayContaining([
        {
          fileDirname,
          from: "./non-exist-files",
          isDefault: true,
          isRenamed: false,
          name: "DEF",
        },
        {
          fileDirname,
          from: "./non-exist-files",
          isDefault: false,
          isRenamed: false,
          name: "X",
        },
        {
          fileDirname,
          from: "./non-exist-files",
          isDefault: false,
          isRenamed: false,
          name: "Y",
        },
        {
          fileDirname,
          from: "./non-exist-files",
          isDefault: false,
          isRenamed: true,
          name: "ZZZ",
        },
      ]),
    );

    expect(result.exports).toEqual(
      new Map([
        ["fun", { line: 4, isPrivate: false }],
        ["fun_default", { line: 6, isPrivate: false }],
        ["variable", { line: 11, isPrivate: false }],
        ["variable2", { line: 13, isPrivate: false }],
        ["private_variable", { line: 19, isPrivate: true }],
        ["Type", { line: 21, isPrivate: false }],
        ["Interface", { line: 23, isPrivate: false }],
        ["X", { line: 28, isPrivate: false }],
      ]),
    );
  });
});
