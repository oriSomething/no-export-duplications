// @ts-check
"use strict";

const ts = require("typescript");

/**
 * @param {import("typescript").Statement} statement
 * @return {boolean}
 */
function hasPrivateJsDocComment(statement) {
  const jsDocs = ts.getJSDocTags(statement);

  if (jsDocs.length === 0) return false;

  for (let tag of jsDocs) {
    if (tag.tagName.escapedText === "private") {
      return true;
    }
  }

  return false;
}

module.exports = hasPrivateJsDocComment;
