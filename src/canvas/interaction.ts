import type { HTMLSource } from "pixi.js/html-source";

export interface InteractionDeps {
  getFrontSource: () => HTMLSource;
}

export interface InteractionApi {
  refresh: () => void;
  // Per-frame: re-rasterize the live front page so native hover/selection/
  // caret/scroll states keep showing up on the shattered chunks.
  drainDirty: () => void;
}

// Keeps the live front page repainting into its texture.
//
// The front page is a real hit-testable child of the canvas, so the browser
// drives :hover/:active/:focus, text selection and native scroll directly.
// We only need to keep requesting paints so those state changes reach the
// rasterized texture the chunks sample from.
export function createInteraction(deps: InteractionDeps): InteractionApi {
  let frontSource = deps.getFrontSource();

  return {
    refresh() {
      frontSource = deps.getFrontSource();
    },
    drainDirty() {
      frontSource.requestPaint();
    },
  };
}
