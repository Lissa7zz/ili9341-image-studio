import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  clampDimension,
  createHeader,
  createIco,
  formatBytes,
  isValidCIdentifier,
  rgbaToRgb565Bytes,
  sanitizeIdentifier,
} from "./core.js";

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  sourceName: document.querySelector("#source-name"),
  sourceSize: document.querySelector("#source-size"),
  sourceFileSize: document.querySelector("#source-file-size"),
  canvas: document.querySelector("#preview-canvas"),
  displaySize: document.querySelector("#display-size"),
  pixelCount: document.querySelector("#pixel-count"),
  dataSize: document.querySelector("#data-size"),
  cropLabel: document.querySelector("#crop-label"),
  width: document.querySelector("#output-width"),
  height: document.querySelector("#output-height"),
  sizePresets: document.querySelector("#size-presets"),
  fitOptions: document.querySelector("#fit-options"),
  rotationOptions: document.querySelector("#rotation-options"),
  focusGrid: document.querySelector("#focus-grid"),
  zoom: document.querySelector("#zoom"),
  zoomValue: document.querySelector("#zoom-value"),
  backgroundColor: document.querySelector("#background-color"),
  backgroundValue: document.querySelector("#background-value"),
  backgroundControl: document.querySelector("#background-control"),
  arrayName: document.querySelector("#array-name"),
  arrayStatus: document.querySelector("#array-status"),
  downloadHeader: document.querySelector("#download-header"),
  downloadBin: document.querySelector("#download-bin"),
  downloadIco: document.querySelector("#download-ico"),
  resetSource: document.querySelector("#reset-source"),
  resetSettings: document.querySelector("#reset-settings"),
  toast: document.querySelector("#toast"),
  helpDialog: document.querySelector("#help-dialog"),
  closeHelp: document.querySelector("#close-help"),
};

const context = elements.canvas.getContext("2d", { willReadFrequently: true });
const toastState = {
  timer: 0,
};

const defaults = {
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  fit: "cover",
  rotation: 0,
  focusX: 0.5,
  focusY: 0.5,
  zoom: 1,
  background: "#000000",
  identifier: "demo_image_rgb565",
};

const state = {
  image: null,
  imageName: "示例画面",
  fileSize: null,
  width: defaults.width,
  height: defaults.height,
  fit: defaults.fit,
  rotation: defaults.rotation,
  focusX: defaults.focusX,
  focusY: defaults.focusY,
  zoom: defaults.zoom,
  background: defaults.background,
  identifier: defaults.identifier,
  rgb565: null,
  busy: false,
};

function showToast(message) {
  window.clearTimeout(toastState.timer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  toastState.timer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2600);
}

function updateActiveButton(container, selector, predicate) {
  for (const button of container.querySelectorAll("button")) {
    button.classList.toggle("active", predicate(button));
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
  }
}

function drawDemo(canvasWidth, canvasHeight) {
  const width = canvasWidth;
  const height = canvasHeight;
  context.save();
  context.clearRect(0, 0, width, height);

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#173b43");
  sky.addColorStop(0.52, "#48787a");
  sky.addColorStop(1, "#d5b677");
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#e5bd72";
  context.beginPath();
  context.arc(width * 0.75, height * 0.28, Math.max(18, width * 0.065), 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#34575a";
  context.beginPath();
  context.moveTo(0, height * 0.7);
  context.lineTo(width * 0.2, height * 0.39);
  context.lineTo(width * 0.39, height * 0.63);
  context.lineTo(width * 0.58, height * 0.34);
  context.lineTo(width * 0.82, height * 0.67);
  context.lineTo(width, height * 0.47);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  context.fillStyle = "#1b3537";
  context.beginPath();
  context.moveTo(0, height * 0.82);
  context.lineTo(width * 0.22, height * 0.63);
  context.lineTo(width * 0.45, height * 0.83);
  context.lineTo(width * 0.68, height * 0.57);
  context.lineTo(width, height * 0.84);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  context.fillStyle = "#f1d18e";
  context.fillRect(width * 0.08, height * 0.72, width * 0.15, 2);
  context.fillRect(width * 0.08, height * 0.76, width * 0.1, 2);

  context.restore();
}

function drawImage() {
  const { width, height } = state;
  if (elements.canvas.width !== width || elements.canvas.height !== height) {
    elements.canvas.width = width;
    elements.canvas.height = height;
  }

  context.save();
  context.clearRect(0, 0, width, height);
  context.fillStyle = state.background;
  context.fillRect(0, 0, width, height);

  if (!state.image) {
    context.restore();
    drawDemo(width, height);
    return;
  }

  const rotated = state.rotation === 90 || state.rotation === 270;
  const effectiveWidth = rotated ? state.image.height : state.image.width;
  const effectiveHeight = rotated ? state.image.width : state.image.height;
  let scaleX;
  let scaleY;

  if (state.fit === "stretch") {
    scaleX = width / effectiveWidth;
    scaleY = height / effectiveHeight;
  } else {
    const fitScale =
      state.fit === "cover"
        ? Math.max(width / effectiveWidth, height / effectiveHeight)
        : Math.min(width / effectiveWidth, height / effectiveHeight);
    scaleX = fitScale;
    scaleY = fitScale;
  }

  scaleX *= state.zoom;
  scaleY *= state.zoom;

  context.translate(width / 2, height / 2);
  context.rotate((state.rotation * Math.PI) / 180);
  context.scale(scaleX, scaleY);
  context.drawImage(
    state.image,
    -state.image.width * state.focusX,
    -state.image.height * state.focusY,
  );
  context.restore();
}

function encodeCanvas() {
  const imageData = context.getImageData(0, 0, state.width, state.height);
  state.rgb565 = rgbaToRgb565Bytes(imageData.data, state.width, state.height);
}

function updateSummary() {
  elements.displaySize.textContent = `${state.width} × ${state.height}`;
  elements.pixelCount.textContent = (state.width * state.height).toLocaleString("en-US");
  elements.dataSize.textContent = formatBytes(state.width * state.height * 2);
  elements.backgroundControl.hidden = state.fit !== "contain";
  elements.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  elements.backgroundValue.textContent = state.background.toUpperCase();
  elements.cropLabel.textContent =
    state.fit === "cover" ? "填充画面" : state.fit === "contain" ? "完整画面" : "拉伸画面";
  elements.resetSource.disabled = !state.image;
  elements.downloadHeader.disabled = !state.image || state.busy;
  elements.downloadBin.disabled = !state.image || state.busy;
  elements.downloadIco.disabled = !state.image || state.busy;
}

function sizeCanvasForStage() {
  const stageStyle = window.getComputedStyle(elements.canvas.parentElement);
  const paddingX =
    (Number.parseFloat(stageStyle.paddingLeft) || 0) +
    (Number.parseFloat(stageStyle.paddingRight) || 0);
  const paddingY =
    (Number.parseFloat(stageStyle.paddingTop) || 0) +
    (Number.parseFloat(stageStyle.paddingBottom) || 0);
  const availableWidth = elements.canvas.parentElement.clientWidth - paddingX;
  const availableHeight = elements.canvas.parentElement.clientHeight - paddingY;

  if (availableWidth <= 0 || availableHeight <= 0) {
    return;
  }

  const scale = Math.min(availableWidth / state.width, availableHeight / state.height);
  elements.canvas.style.width = `${Math.max(1, Math.floor(state.width * scale))}px`;
  elements.canvas.style.height = `${Math.max(1, Math.floor(state.height * scale))}px`;
}

function render({ encode = true } = {}) {
  drawImage();
  if (encode && state.image) {
    encodeCanvas();
  }
  updateSummary();
  sizeCanvasForStage();
}

function setDimensions(width, height, { syncInputs = true } = {}) {
  const nextWidth = clampDimension(width);
  const nextHeight = clampDimension(height);
  if (!nextWidth || !nextHeight) {
    showToast("尺寸需要在 16 到 1024 像素之间");
    return false;
  }

  state.width = nextWidth;
  state.height = nextHeight;

  if (syncInputs) {
    elements.width.value = String(nextWidth);
    elements.height.value = String(nextHeight);
  }

  updateActiveButton(
    elements.sizePresets,
    "button",
    (button) =>
      Number(button.dataset.width) === state.width &&
      Number(button.dataset.height) === state.height,
  );
  render();
  return true;
}

function resetSettings() {
  state.width = defaults.width;
  state.height = defaults.height;
  state.fit = defaults.fit;
  state.rotation = defaults.rotation;
  state.focusX = defaults.focusX;
  state.focusY = defaults.focusY;
  state.zoom = defaults.zoom;
  state.background = defaults.background;
  state.identifier = state.image
    ? sanitizeIdentifier(defaultIdentifierFor(state.imageName))
    : defaults.identifier;

  elements.width.value = String(state.width);
  elements.height.value = String(state.height);
  elements.zoom.value = String(Math.round(state.zoom * 100));
  elements.backgroundColor.value = state.background;
  elements.arrayName.value = state.identifier;
  elements.arrayStatus.textContent = "有效";

  updateActiveButton(
    elements.sizePresets,
    "button",
    (button) =>
      Number(button.dataset.width) === state.width &&
      Number(button.dataset.height) === state.height,
  );
  updateActiveButton(elements.fitOptions, "button", (button) => button.dataset.fit === state.fit);
  updateActiveButton(
    elements.rotationOptions,
    "button",
    (button) => Number(button.dataset.rotation) === state.rotation,
  );
  updateActiveButton(
    elements.focusGrid,
    "button",
    (button) =>
      Number(button.dataset.x) === state.focusX && Number(button.dataset.y) === state.focusY,
  );
  render();
}

function defaultIdentifierFor(fileName) {
  const base = fileName.replace(/\.[^.]+$/, "");
  return sanitizeIdentifier(`${base}_rgb565`);
}

async function loadFile(file) {
  if (!file) {
    return;
  }

  const supportedExtension = /\.(jpe?g|png|webp|bmp)$/i.test(file.name);
  if (!file.type.startsWith("image/") && !(file.type === "" && supportedExtension)) {
    showToast("请选择 JPG、PNG 或 WebP 图片");
    return;
  }

  if (file.size > 30 * 1024 * 1024) {
    showToast("图片超过 30 MB，请先压缩后再试");
    return;
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";

  try {
    image.src = url;
    await image.decode();
  } catch {
    URL.revokeObjectURL(url);
    showToast("浏览器无法解码这张图片");
    return;
  }

  state.image = image;
  state.imageName = file.name;
  state.fileSize = file.size;
  state.identifier = defaultIdentifierFor(file.name);
  elements.arrayName.value = state.identifier;
  elements.arrayStatus.textContent = "有效";
  elements.sourceName.textContent = file.name;
  elements.sourceSize.textContent = `${image.naturalWidth} × ${image.naturalHeight}`;
  elements.sourceFileSize.textContent = formatBytes(file.size);
  elements.resetSource.disabled = false;

  render();
  showToast("图片已载入，画面已自动适配");

  image.addEventListener(
    "load",
    () => {
      URL.revokeObjectURL(url);
    },
    { once: true },
  );
  if (image.complete) {
    URL.revokeObjectURL(url);
  }
}

function clearImage() {
  state.image = null;
  state.imageName = "示例画面";
  state.fileSize = null;
  state.rgb565 = null;
  state.identifier = defaults.identifier;
  elements.fileInput.value = "";
  elements.sourceName.textContent = "示例画面";
  elements.sourceSize.textContent = "演示";
  elements.sourceFileSize.textContent = "--";
  elements.arrayName.value = state.identifier;
  elements.arrayStatus.textContent = "有效";
  resetSettings();
  showToast("已清除图片");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ensureEncoded() {
  if (!state.rgb565) {
    encodeCanvas();
  }
}

function downloadHeader() {
  if (!state.image) {
    return;
  }

  const identifier = sanitizeIdentifier(elements.arrayName.value, state.identifier);
  if (!isValidCIdentifier(identifier)) {
    showToast("请填写有效的 C 数组名");
    return;
  }

  state.identifier = identifier;
  elements.arrayName.value = identifier;
  ensureEncoded();

  const header = createHeader({
    identifier,
    width: state.width,
    height: state.height,
    data: state.rgb565,
    sourceName: state.imageName,
  });
  downloadBlob(new Blob([header], { type: "text/x-c;charset=utf-8" }), `${identifier}.h`);
  showToast("STM32 头文件已生成");
}

function downloadBinary() {
  if (!state.image) {
    return;
  }

  ensureEncoded();
  const identifier = sanitizeIdentifier(elements.arrayName.value, state.identifier);
  downloadBlob(new Blob([state.rgb565], { type: "application/octet-stream" }), `${identifier}.bin`);
  showToast("RGB565 原始数据已生成");
}

async function downloadIcon() {
  if (!state.image) {
    return;
  }

  state.busy = true;
  updateSummary();
  const iconCanvas = document.createElement("canvas");
  const size = 256;
  iconCanvas.width = size;
  iconCanvas.height = size;
  const iconContext = iconCanvas.getContext("2d");
  const rotated = state.rotation === 90 || state.rotation === 270;
  const effectiveWidth = rotated ? state.image.height : state.image.width;
  const effectiveHeight = rotated ? state.image.width : state.image.height;
  const scale = Math.max(size / effectiveWidth, size / effectiveHeight) * state.zoom;

  iconContext.fillStyle = state.background;
  iconContext.fillRect(0, 0, size, size);
  iconContext.save();
  iconContext.translate(size / 2, size / 2);
  iconContext.rotate((state.rotation * Math.PI) / 180);
  iconContext.scale(scale, scale);
  iconContext.drawImage(
    state.image,
    -state.image.width * state.focusX,
    -state.image.height * state.focusY,
  );
  iconContext.restore();

  const renderAsPng = () =>
    new Promise((resolve, reject) => {
      iconCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("ICO PNG encoding failed"));
        }
      }, "image/png");
    });

  try {
    const png = await renderAsPng();
    const bytes = new Uint8Array(await png.arrayBuffer());
    const ico = createIco(bytes, size);
    downloadBlob(new Blob([ico], { type: "image/x-icon" }), "favicon.ico");
    showToast("项目图标 favicon.ico 已生成");
  } catch {
    showToast("项目图标生成失败");
  } finally {
    state.busy = false;
    updateSummary();
  }
}

elements.dropZone.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", (event) => loadFile(event.target.files?.[0]));

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("drag-over");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("drag-over");
  });
}

elements.dropZone.addEventListener("drop", (event) => {
  loadFile(event.dataTransfer?.files?.[0]);
});

elements.width.addEventListener("change", () => {
  setDimensions(elements.width.value, state.height);
});
elements.height.addEventListener("change", () => {
  setDimensions(state.width, elements.height.value);
});

elements.sizePresets.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  setDimensions(Number(button.dataset.width), Number(button.dataset.height));
});

elements.fitOptions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  state.fit = button.dataset.fit;
  updateActiveButton(
    elements.fitOptions,
    "button",
    (option) => option.dataset.fit === state.fit,
  );
  render();
});

elements.rotationOptions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  state.rotation = Number(button.dataset.rotation);
  updateActiveButton(
    elements.rotationOptions,
    "button",
    (option) => Number(option.dataset.rotation) === state.rotation,
  );
  render();
});

elements.focusGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  state.focusX = Number(button.dataset.x);
  state.focusY = Number(button.dataset.y);
  updateActiveButton(
    elements.focusGrid,
    "button",
    (option) =>
      Number(option.dataset.x) === state.focusX && Number(option.dataset.y) === state.focusY,
  );
  render();
});

elements.zoom.addEventListener("input", () => {
  state.zoom = Number(elements.zoom.value) / 100;
  render();
});

elements.backgroundColor.addEventListener("input", () => {
  state.background = elements.backgroundColor.value;
  render();
});

elements.arrayName.addEventListener("input", () => {
  const valid = isValidCIdentifier(elements.arrayName.value);
  elements.arrayStatus.textContent = valid ? "有效" : "名称无效";
  elements.arrayStatus.style.color = valid ? "" : "#a83f24";
});

elements.arrayName.addEventListener("blur", () => {
  state.identifier = sanitizeIdentifier(elements.arrayName.value, state.identifier);
  elements.arrayName.value = state.identifier;
  elements.arrayStatus.textContent = "有效";
  elements.arrayStatus.style.color = "";
});

elements.resetSource.addEventListener("click", clearImage);
elements.resetSettings.addEventListener("click", resetSettings);
elements.downloadHeader.addEventListener("click", downloadHeader);
elements.downloadBin.addEventListener("click", downloadBinary);
elements.downloadIco.addEventListener("click", downloadIcon);
elements.closeHelp.addEventListener("click", () => elements.helpDialog.close());

if ("ResizeObserver" in window) {
  const canvasResizeObserver = new ResizeObserver(sizeCanvasForStage);
  canvasResizeObserver.observe(elements.canvas.parentElement);
}

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") {
    event.preventDefault();
    elements.fileInput.click();
  }
});
window.addEventListener("resize", sizeCanvasForStage);

resetSettings();
