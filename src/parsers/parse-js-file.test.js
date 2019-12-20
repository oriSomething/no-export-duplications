// @ts-check
"use strict";

//#region Imports
const path = require("path");
const fs = require("fs");
const parseJsFile = require("./parse-js-file");
//#endregion

describe("parseJsFile()", function() {
  test("Sanity", function() {
    const testUri = "/ori/__fixtures__/sanity-js.js";
    const fileDirname = "/ori/__fixtures__";

    const result = parseJsFile({
      code: fs.readFileSync(path.resolve(__dirname, "../__fixtures__/sanity-js.js")).toString(),
      uri: testUri,
    });

    expect(result.imports).toEqual([
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
      {
        fileDirname,
        from: "./non-exist-files",
        isDefault: false,
        isRenamed: false,
        name: "ImportedType",
      },
    ]);

    expect(result.exports).toEqual(
      new Map([
        ["fun", { line: 3, isPrivate: false }],
        ["fun_default", { line: 5, isPrivate: false }],
        ["variable", { line: 10, isPrivate: false }],
        ["variable2", { line: 12, isPrivate: false }],
        // JS doesn't support extract JSDoc
        ["private_variable", { line: 18, isPrivate: true }],
        ["Type", { line: 20, isPrivate: false }],
        ["Interface", { line: 22, isPrivate: false }],
        ["X", { line: 27, isPrivate: false }],
        ["ImportedType", { line: 32, isPrivate: false }],
      ]),
    );
  });
});
