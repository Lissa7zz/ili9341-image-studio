import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { JSDOM } from "jsdom";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const markup = html
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<link[^>]+stylesheet[^>]*>/g, "");
const dom = new JSDOM(markup, {
  url: "http://127.0.0.1:4173/",
  pretendToBeVisual: true,
});

const { window } = dom;
const contextStub = {
  clearRect() {},
  fillRect() {},
  save() {},
  restore() {},
  translate() {},
  rotate() {},
  scale() {},
  drawImage() {},
  beginPath() {},
  arc() {},
  moveTo() {},
  lineTo() {},
  closePath() {},
  fill() {},
  createLinearGradient() {
    return { addColorStop() {} };
  },
  getImageData(_x, _y, width, height) {
    return {
      data: new Uint8ClampedArray(width * height * 4).fill(128),
    };
  },
};

window.HTMLCanvasElement.prototype.getContext = () => contextStub;
window.HTMLDialogElement.prototype.close = function close() {
  this.open = false;
};
window.URL.createObjectURL = () => "blob:test";
window.URL.revokeObjectURL = () => {};

let lastDownload = null;
window.HTMLAnchorElement.prototype.click = function click() {
  lastDownload = { name: this.download, href: this.href };
};

globalThis.window = window;
globalThis.document = window.document;
globalThis.Image = window.Image;
globalThis.Blob = window.Blob;
globalThis.File = window.File;
globalThis.FileList = window.FileList;
globalThis.URL = window.URL;
globalThis.HTMLCanvasElement = window.HTMLCanvasElement;
globalThis.HTMLAnchorElement = window.HTMLAnchorElement;

await import(`../src/app.js?test=${Date.now()}`);

test("initializes the default 320 x 240 workspace", () => {
  assert.equal(document.querySelector("#output-width").value, "320");
  assert.equal(document.querySelector("#output-height").value, "240");
  assert.equal(document.querySelector("#data-size").textContent, "150 KB");
  assert.equal(document.querySelector("#download-header").disabled, true);
  assert.equal(document.querySelector("#preview-canvas").width, 320);
  assert.equal(document.querySelector("#preview-canvas").height, 240);
});

test("switches between landscape and portrait presets", () => {
  document.querySelector('[data-width="240"][data-height="320"]').click();
  assert.equal(document.querySelector("#output-width").value, "240");
  assert.equal(document.querySelector("#output-height").value, "320");
  assert.equal(document.querySelector("#data-size").textContent, "150 KB");
  assert.equal(document.querySelector("#preview-canvas").width, 240);
  assert.equal(document.querySelector("#preview-canvas").height, 320);
});

test("loads an image and enables exports", async () => {
  const input = document.querySelector("#file-input");
  const file = new File(["fake-image"], "224-photo name.png", {
    type: "image/png",
  });
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file],
  });
  const originalImage = window.Image;
  window.Image = class TestImage {
    constructor() {
      this.width = 640;
      this.height = 480;
      this.naturalWidth = 640;
      this.naturalHeight = 480;
      this.complete = true;
    }

    async decode() {}

    addEventListener() {}
  };
  globalThis.Image = window.Image;

  input.dispatchEvent(new window.Event("change", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  window.Image = originalImage;
  assert.equal(document.querySelector("#source-name").textContent, "224-photo name.png");
  assert.equal(document.querySelector("#source-size").textContent, "640 × 480");
  assert.equal(document.querySelector("#array-name").value, "image_224_photo_name_rgb565");
  assert.equal(document.querySelector("#download-header").disabled, false);
  assert.equal(document.querySelector("#download-bin").disabled, false);
  assert.equal(document.querySelector("#download-ico").disabled, false);
});

test("downloads the generated C header with the expected name", () => {
  document.querySelector("#download-header").click();
  assert.equal(lastDownload.name, "image_224_photo_name_rgb565.h");
  assert.equal(lastDownload.href, "blob:test");
});

test("switches to contain mode and reveals the background control", () => {
  document.querySelector('[data-fit="contain"]').click();
  assert.equal(document.querySelector("#crop-label").textContent, "完整画面");
  assert.equal(document.querySelector("#background-control").hidden, false);
});
