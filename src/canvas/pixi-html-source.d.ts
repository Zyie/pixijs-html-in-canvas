// `HTMLSource` ships in the pinned pixi.js 8.18.0 runtime as part of the
// experimental HTML-in-Canvas support, but is not yet in the published type
// declarations. This augments the module so the demo type-checks against the
// small surface it actually uses. Drop this file once HTMLSource is released
// in the pixi.js types.
import type { TextureSource } from "pixi.js";

declare module "pixi.js" {
  interface HTMLSourceOptions {
    resource: Element;
    width?: number;
    height?: number;
    autoUpdate?: boolean;
    autoLayout?: boolean;
    autoRequestPaint?: boolean;
  }

  class HTMLSource extends TextureSource {
    constructor(options: HTMLSourceOptions);
    get isReady(): boolean;
    requestPaint(): boolean;
  }
}
