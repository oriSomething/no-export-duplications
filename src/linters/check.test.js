// @ts-check
"use strict";

describe("analyze()", function() {
  //#region Tests
  test("Sanity", function() {
    const analyze = require("./analyze");
    const check = require("./check");

    const filesExports = analyze(resolve("../__fixtures__/prj-1-ts"));
    const result = check(filesExports);

    expect(mapResult(result)).toEqual({
      b: expect.arrayContaining([
        //
        ["../__fixtures__/prj-1-ts/lib/file1.ts", expect.any(Number)],
        ["../__fixtures__/prj-1-ts/lib/file2.ts", expect.any(Number)],
      ]),
    });
  });
  //#endregion
});

//#region Helpers
/**
 * @param {ReturnType<typeof import("./check")>} result
 */
function mapResult(result) {
  /** @type Record<string, [string, number][]> */
  const mapped = {};

  result.forEach((data, name) => {
    mapped[name] = data.map(({ uri, line }) => [relative(uri), line]);
  });

  return mapped;
}

/**
 * @param {string} file
 */
function resolve(file) {
  const path = require("path");

  return path.resolve(__dirname, file);
}

/**
 * @param {string} file
 */
function relative(file) {
  const path = require("path");

  return path.relative(__dirname, file);
}
//#endregion
