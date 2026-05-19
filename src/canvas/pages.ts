import { HTMLSource, Sprite, Texture } from "pixi.js";

import engineHtml from "../content/engine.html?raw";
import { siteHtml } from "../content/site";
import type { PageBounds } from "./viewport";

export interface PagesApi {
  frontSource: HTMLSource;
  // Rebuilds both HTML sources for the current page sizing and rebinds the
  // back sprite texture. Caller refreshes interaction + chunks afterwards.
  rebuildSources: (pageBounds: PageBounds, backSprite: Sprite) => void;
}

export function createPages(
  canvas: HTMLElement,
  pageBounds: PageBounds,
  backSprite: Sprite,
): PagesApi {
  const enginePage = document.createElement("section");
  const sitePage = document.createElement("section");

  sitePage.className = "html-canvas-page site";
  sitePage.innerHTML = siteHtml;

  enginePage.className = "html-canvas-page engine";
  enginePage.innerHTML = engineHtml;
  enginePage.inert = true;

  const backPage: HTMLElement = enginePage;
  const frontPage: HTMLElement = sitePage;

  canvas.appendChild(backPage);
  canvas.appendChild(frontPage);

  function makeSource(resource: HTMLElement, bounds: PageBounds): HTMLSource {
    // Only the live site page emits paint/changedElements as it scrolls and
    // selects, so it needs autoUpdate to re-rasterize. The engine page is
    // static and inert; with autoUpdate it would never appear in
    // changedElements after a rebuild (e.g. on resize) and HTMLSource.isReady
    // would stay false, leaving the texture blank. autoUpdate:false makes it
    // ready at construction so it uploads at the new size every rebuild.
    const source = new HTMLSource({
      resource,
      width: bounds.width,
      height: bounds.height,
      autoUpdate: resource === sitePage,
    });

    source.scaleMode = "linear";
    source.requestPaint();

    return source;
  }

  let backSource = makeSource(backPage, pageBounds);
  let frontSource = makeSource(frontPage, pageBounds);

  let backTexture = new Texture({ source: backSource });

  backSprite.texture = backTexture;

  const api: PagesApi = {
    get frontSource() {
      return frontSource;
    },
    rebuildSources(bounds, sprite) {
      backTexture.destroy(false);
      backSource.destroy();
      frontSource.destroy();

      backSource = makeSource(backPage, bounds);
      frontSource = makeSource(frontPage, bounds);

      backTexture = new Texture({ source: backSource });
      sprite.texture = backTexture;
    },
  };

  return api;
}
