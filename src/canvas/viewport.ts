import type { Application, Container, Graphics } from "pixi.js";
import { Rectangle } from "pixi.js";

import { nextDoubleFrame } from "../lib/dom";

export interface PageBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportDeps {
  app: Application;
  pageBounds: PageBounds;
  frontLayer: Container;
  laserLayer: Graphics;
  // Resize the texture sources + chunk grid; also refreshes interaction and
  // resets damage.
  rebuildSources: () => void;
  syncBackSprite: () => void;
  redrawVignette: () => void;
}

export interface ViewportApi {
  // Debounced (180ms) resize/orientation entry point.
  scheduleRelayout: () => void;
  // Wire the renderer resize + orientationchange listeners.
  attach: () => void;
}

export function createViewport(deps: ViewportDeps): ViewportApi {
  const { app, pageBounds, frontLayer, laserLayer } = deps;
  let relayoutPending = 0;

  // Re-fit the scene to the current canvas size. The HTML pages already flow
  // to 100% of the canvas via CSS; here we resize the texture sources, the
  // chunk grid and every fixed-size view rectangle to match.
  async function relayout(): Promise<void> {
    const viewW = Math.max(1, app.screen.width);
    const viewH = Math.max(1, app.screen.height);

    pageBounds.width = viewW;
    pageBounds.height = viewH;

    frontLayer.filterArea = new Rectangle(0, 0, viewW, viewH);
    laserLayer.filterArea = new Rectangle(0, 0, viewW, viewH);
    app.stage.hitArea = new Rectangle(0, 0, viewW, viewH);

    // Let the DOM pages reflow into the resized canvas before recapturing.
    await nextDoubleFrame();

    deps.syncBackSprite();
    deps.rebuildSources();
    deps.redrawVignette();
  }

  function scheduleRelayout(): void {
    window.clearTimeout(relayoutPending);
    relayoutPending = window.setTimeout(() => {
      void relayout();
    }, 180);
  }

  return {
    scheduleRelayout,
    attach() {
      app.renderer.on("resize", scheduleRelayout);
      window.addEventListener("orientationchange", scheduleRelayout);
    },
  };
}
