// @ts-ignore
import DEF, { X, Y, Z as ZZZ } from "./non-exist-files";

export function fun() {}

export default function fun_default() {}

/**
 * @type {number}
 */
export var variable = 1;

export { variable as variable2 };

/**
 * @type {number}
 * @private
 */
export var private_variable = 1;

export type Type = unknown;

export interface Interface {}

// @ts-ignore
export * from "Blah";

export { X };

var NOT_EXPORTED = 1;
