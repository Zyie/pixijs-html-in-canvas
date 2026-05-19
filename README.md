# pixijs-html-in-canvas

A PixiJS demo of the experimental [HTML-in-Canvas](https://github.com/WICG/html-in-canvas)
API. A live, interactive HTML landing page is captured as a WebGL texture, then
sliced apart by an automated scanner to reveal the render pipeline beneath.

The page stays fully interactive (scroll, links, text selection) while it is
rendered, torn, and healed inside the Pixi scene.

## Requirements

This demo depends on the renderer exposing the HTML-in-Canvas
`texElementImage2D` entry point. It currently runs in **Chrome with
`chrome://flags/#canvas-draw-element` enabled**. Unsupported browsers render a
fallback notice instead of the scene.

## Develop

```bash
npm install
npm run dev
```

Opens at http://localhost:8080.

## Build

```bash
npm run build
```

Outputs a static site to `dist/`.

## Deploy

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every
push to `main`. Enable it once in **Settings → Pages → Build and deployment →
Source: GitHub Actions**. The workflow injects the correct base path for the
project page automatically, so `vite.config.ts` needs no `base` setting.
