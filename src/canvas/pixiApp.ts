import { Application } from "pixi.js";
import type { HTMLSourceCanvas } from "pixi.js/html-source";

import { SHADOW } from "../lib/colors";
import unsupportedHtml from "../content/unsupported.html?raw";

export interface CreateAppResult {
  app: Application;
}

// Creates the Pixi application sized to the container. Returns null (after
// rendering the unsupported page) when the browser lacks the experimental
// HTML-in-Canvas `requestPaint` API this demo's HTMLSource depends on.
export async function createApp(
  container: HTMLElement,
): Promise<CreateAppResult | null> {
  const app = new Application();

  const viewW = Math.max(1, container.clientWidth || window.innerWidth);
  const viewH = Math.max(1, container.clientHeight || window.innerHeight);

  await app.init({
    width: viewW,
    height: viewH,
    resizeTo: container,
    preference: "webgl",
    backgroundAlpha: 1,
    background: SHADOW,
    antialias: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    roundPixels: true,
  });

  container.appendChild(app.canvas);
  Object.assign(app.canvas.style, {
    position: "absolute",
    inset: "0",
    display: "block",
    touchAction: "auto",
    imageRendering: "pixelated",
  });

  const canvas = app.canvas as HTMLSourceCanvas;

  if (typeof canvas.requestPaint !== "function") {
    container.innerHTML = unsupportedHtml;

    return null;
  }

  return { app };
}
