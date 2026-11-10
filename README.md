[English](README.md) | [简体中文](README.zh-CN.md)

# Pixel2Panel

Pixel2Panel is a browser-based image preparation tool for STM32 and ILI9341
displays. Drop in an image, fit it to the display dimensions, convert it to
RGB565, and download a C header that can be added directly to an STM32 project.

All image processing happens locally in the browser. Images are not uploaded
to a server.

![Pixel2Panel](assets/logo-256.png)

## Features

- JPG, PNG, WebP, and BMP input
- Cover, contain, and stretch fitting modes
- Three-by-three focus control, zoom, rotation, and custom dimensions
- RGB565 C header export
- Raw RGB565 `.bin` export
- 256 x 256 PNG-backed `.ico` project icon export
- No runtime dependencies and no backend

## Quick start

Node.js 18 or newer is required.

```bash
npm start
```

Open `http://127.0.0.1:4173`.

The page uses ES modules, so access it through a local server instead of
opening `index.html` directly.

Windows users can also run `start.bat`. It starts the local server and opens
the browser.

## Export format

The default output is `320 x 240` RGB565. Each pixel uses two bytes with the
high byte first. This matches STM32 little-endian `uint16_t` storage and the
byte order used by the included ILI9341 driver.

The generated array can be passed directly to `LCD_DrawImage()`:

```c
#include "photo_rgb565.h"

LCD_DrawImage(photo_rgb565, PHOTO_RGB565_DATA_SIZE);
```

A full-screen `320 x 240` RGB565 image contains:

```text
320 * 240 * 2 = 153,600 bytes
```

## Development

```bash
npm test
npm start
```

Core encoding logic is in `src/core.js`. Browser interaction and Canvas
rendering are in `src/app.js`.

Browser interaction tests use jsdom. The production page has no runtime
dependencies.

## Roadmap

- Batch image processing and multi-image slideshow headers
- Compressed formats loaded from external SPI Flash
- More precise drag positioning and comparison previews
- Generated STM32 example projects

## Third-party references

The workflow was informed by the following online tools. This project does
not call their servers or APIs:

- Photopea: image editing and resizing
- AppShot ICO: project icon generation
- Image to RGB565 Converter: RGB565 conversion

## License

[MIT](LICENSE)
