import { Application } from "pixi.js";

import { SHADOW } from "../lib/colors";
import unsupportedHtml from "../content/unsupported.html?raw";

export interface CreateAppResult {
  app: Application;
}

// `gl` and the experimental `texElementImage2D` entry point are not in the
// pixi.js renderer types; probe for them through a minimal capability shape
// rather than asserting an unrelated WebGL type.
interface HtmlInCanvasRenderer {
  gl?: { texElementImage2D?: unknown };
}

// Creates the Pixi application sized to the container. Returns null (after
// rendering the unsupported page) when the renderer lacks the HTML-in-Canvas
// `texElementImage2D` entry point this demo depends on.
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

  const rendererGL = (app.renderer as unknown as HtmlInCanvasRenderer).gl;

  if (!rendererGL || !("texElementImage2D" in rendererGL)) {
    container.innerHTML = unsupportedHtml;

    return null;
  }

  return { app };
}
