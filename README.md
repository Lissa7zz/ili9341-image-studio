# Pixel2Panel

Pixel2Panel 是一个面向 STM32 和 ILI9341 屏幕的浏览器图片处理工具。拖入图片后，它会自动裁切成屏幕尺寸，转换为 RGB565，并生成可直接加入 STM32 工程的 C 头文件。

所有图片处理都在浏览器本地完成，不会上传到服务器。

![Pixel2Panel](assets/logo-256.png)

## 功能

- JPG、PNG、WebP、BMP 图片输入
- 填充、完整显示、拉伸三种适配模式
- 九宫格焦点、缩放、旋转和自定义尺寸
- RGB565 C 头文件导出
- 原始 RGB565 `.bin` 导出
- 256 x 256 PNG-backed `.ico` 项目图标导出
- 零运行时依赖，不需要后端

## 快速启动

需要 Node.js 18 或更高版本。

```bash
npm start
```

然后访问 `http://127.0.0.1:4173`。

由于页面使用 ES Module，请通过本地服务器访问，不要直接双击 `index.html`。

Windows 用户也可以双击 `start.bat`，脚本会启动本地服务并打开浏览器。

## 导出格式

默认输出为 `320 x 240`，RGB565，每个像素两个字节，高字节先发送。这个顺序与 STM32 小端内存中的 `uint16_t` 顺序以及 ILI9341 的接收顺序一致。

生成的数组可以直接传给项目中已有的 `LCD_DrawImage()`：

```c
#include "photo_rgb565.h"

LCD_DrawImage(photo_rgb565, PHOTO_RGB565_DATA_SIZE);
```

全屏 `320 x 240` RGB565 图片大小为：

```text
320 * 240 * 2 = 153,600 bytes
```

## 开发

```bash
npm test
npm start
```

核心编码逻辑位于 `src/core.js`，页面交互和 Canvas 绘制位于 `src/app.js`。

浏览器交互测试使用 jsdom，生产页面本身没有运行时依赖。

## 路线图

- 批量图片处理和多图轮播头文件
- 从外部 SPI Flash 加载的压缩格式
- 更细致的拖拽构图和对比预览
- 自动生成 STM32 示例工程

## 第三方参考

工作流参考了以下在线工具的使用方式，但本项目不依赖它们的服务器或接口：

- Photopea：图片编辑和尺寸调整
- AppShot ICO：项目图标生成
- Image to RGB565 Converter：RGB565 数据转换

## License

[MIT](LICENSE)
