/**
 * A branded type representing an opaque hexadecimal color string, e.g. "#ff0000". Short form
 * (e.g. "#f00") is not allowed.
 */
export type HexString = string & { readonly __brand: unique symbol };