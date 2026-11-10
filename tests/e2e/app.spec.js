import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const demoImage = fileURLToPath(new URL("../../assets/demo.jpg", import.meta.url));

test("loads an image, renders it, and downloads an STM32 source archive", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Pixel2Panel/);
  await expect(page.locator("#preview-canvas")).toBeVisible();

  await page.locator("#file-input").setInputFiles(demoImage);
  await expect(page.locator("#source-name")).toHaveText("demo.jpg");
  await expect(page.locator("#download-header")).toBeEnabled();

  const rendered = await page.locator("#preview-canvas").evaluate((canvas) => {
    const pixel = canvas
      .getContext("2d")
      .getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1)
      .data;
    return {
      width: canvas.width,
      height: canvas.height,
      alpha: pixel[3],
    };
  });
  expect(rendered).toEqual({ width: 320, height: 240, alpha: 255 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#download-header").click(),
  ]);
  expect(download.suggestedFilename()).toBe("demo_rgb565.zip");

  const downloadPath = await download.path();
  const archive = await readFile(downloadPath);
  expect(archive.readUInt32LE(0)).toBe(0x04034b50);
  expect(archive.includes(Buffer.from("demo_rgb565.h"))).toBe(true);
  expect(archive.includes(Buffer.from("demo_rgb565.c"))).toBe(true);
});

test("fits the workspace without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport + 1);
});
