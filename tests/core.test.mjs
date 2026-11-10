import assert from "node:assert/strict";
import test from "node:test";

import {
  createHeader,
  createIco,
  createSource,
  createZip,
  formatBytes,
  isValidCIdentifier,
  rgbToRgb565,
  rgbaToRgb565Bytes,
  sanitizeIdentifier,
} from "../src/core.js";

test("converts primary RGB colors to RGB565", () => {
  assert.equal(rgbToRgb565(0, 0, 0), 0x0000);
  assert.equal(rgbToRgb565(255, 255, 255), 0xffff);
  assert.equal(rgbToRgb565(255, 0, 0), 0xf800);
  assert.equal(rgbToRgb565(0, 255, 0), 0x07e0);
  assert.equal(rgbToRgb565(0, 0, 255), 0x001f);
});

test("emits high-byte-first RGB565 pairs", () => {
  const pixels = new Uint8ClampedArray([
    255, 0, 0, 255,
    0, 255, 0, 255,
    0, 0, 255, 255,
    255, 255, 255, 255,
  ]);
  const output = rgbaToRgb565Bytes(pixels, 2, 2);
  assert.deepEqual(Array.from(output), [
    0xf8, 0x00,
    0x07, 0xe0,
    0x00, 0x1f,
    0xff, 0xff,
  ]);
});

test("rejects malformed RGBA input", () => {
  assert.throws(
    () => rgbaToRgb565Bytes(new Uint8ClampedArray([0, 0, 0]), 1, 1),
    /Expected 4 RGBA bytes/,
  );
});

test("sanitizes identifiers for generated C files", () => {
  assert.equal(sanitizeIdentifier("224-photo name"), "image_224_photo_name");
  assert.equal(isValidCIdentifier("image_224_photo_name"), true);
  assert.equal(isValidCIdentifier("224_photo"), false);
});

test("creates a declaration-only STM32 C header", () => {
  const data = new Uint8Array([0xf8, 0x00, 0x07, 0xe0]);
  const header = createHeader({
    identifier: "test_image",
    width: 2,
    height: 1,
    data,
    sourceName: "test.png",
    generatedAt: new Date("2026-11-10T00:00:00Z"),
  });

  assert.match(header, /#include <stdint\.h>/);
  assert.match(header, /#define TEST_IMAGE_WIDTH 2U/);
  assert.match(header, /#define TEST_IMAGE_HEIGHT 1U/);
  assert.match(header, /#define TEST_IMAGE_DATA_SIZE \(TEST_IMAGE_WIDTH \* TEST_IMAGE_HEIGHT \* 2U\)/);
  assert.match(header, /extern const uint8_t test_image\[TEST_IMAGE_DATA_SIZE\];/);
  assert.doesNotMatch(header, /0xF8U/);
});

test("creates the matching STM32 C source", () => {
  const source = createSource({
    identifier: "test_image",
    width: 2,
    height: 1,
    data: new Uint8Array([0xf8, 0x00, 0x07, 0xe0]),
    sourceName: "test.png",
    generatedAt: new Date("2026-11-10T00:00:00Z"),
  });

  assert.match(source, /#include "test_image\.h"/);
  assert.match(source, /const uint8_t test_image\[TEST_IMAGE_DATA_SIZE\]/);
  assert.match(source, /0xF8U, 0x00U, 0x07U, 0xE0U/);
  assert.doesNotMatch(source, /#ifndef/);
});

test("creates a standard PNG-backed ICO container", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  const ico = createIco(png, 256);
  const view = new DataView(ico.buffer, ico.byteOffset, ico.byteLength);

  assert.equal(view.getUint16(0, true), 0);
  assert.equal(view.getUint16(2, true), 1);
  assert.equal(view.getUint16(4, true), 1);
  assert.equal(ico[6], 0);
  assert.equal(ico[7], 0);
  assert.equal(view.getUint32(14, true), png.length);
  assert.equal(view.getUint32(18, true), 22);
  assert.deepEqual(Array.from(ico.subarray(22)), Array.from(png));
});

test("formats image data sizes", () => {
  assert.equal(formatBytes(153600), "150 KB");
  assert.equal(formatBytes(512), "512 B");
});

test("creates a ZIP archive containing source and header files", () => {
  const archive = createZip(
    [
      { name: "test_image.h", data: "#pragma once\n" },
      { name: "test_image.c", data: "const int test_image = 1;\n" },
    ],
    new Date("2026-11-10T00:00:00Z"),
  );
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  const text = new TextDecoder().decode(archive);
  assert.match(text, /test_image\.h/);
  assert.match(text, /test_image\.c/);
  assert.equal(view.getUint32(archive.length - 22, true), 0x06054b50);
});
