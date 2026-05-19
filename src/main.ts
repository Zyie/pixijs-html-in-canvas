// description: A PixiJS-branded pixel art landing page is sliced apart by an automated scanner.
import { Container, Graphics, Rectangle, Sprite } from "pixi.js";
import {
  AdvancedBloomFilter,
  DropShadowFilter,
  GlowFilter,
} from "pixi-filters";
import { inject } from "@vercel/analytics";

import { Cat, loadCatAssets } from "./scene/cat";
import {
  buildChunks,
  clearChunks,
  createChunkState,
  integrateChunks,
  resetChunks,
  sliceAlongPath,
  syncBackSprite,
  updateHealing,
  type ChunkArrays,
  type PageChunk,
} from "./scene/chunks";
import { PINK_HOT, SHADOW } from "./lib/colors";
import { config } from "./config/config";
import { CAT_ENTRY_PROGRESS, START_DELAY } from "./config/constants";
import { nextDoubleFrame } from "./lib/dom";
import {
  decayTrail,
  drawLaser,
  integrateSparks,
  redrawVignette,
  type Spark,
  type TrailPoint,
} from "./scene/effects";
import { createInteraction } from "./canvas/interaction";
import { createLaser, seedLaser, updateLaser } from "./scene/laser";
import { createPages } from "./canvas/pages";
import { mountLoadingScreen } from "./canvas/loadingScreen";
import { createApp } from "./canvas/pixiApp";
import { styles } from "./content/styles";
import { createViewport, type PageBounds } from "./canvas/viewport";

inject();

(async () => {
  const fontsReady = Promise.all([
    document.fonts.load('64px "Press Start 2P"'),
    document.fonts.load('bold 14px "Press Start 2P"'),
    document.fonts.load('24px "VT323"'),
  ]);

  const style = document.createElement("style");

  style.textContent = styles;
  document.head.appendChild(style);

  const container = document.getElementById("pixi-container");

  if (!container) {
    throw new Error("Missing #pixi-container");
  }

  const loader = mountLoadingScreen(container);

  const created = await createApp(container);

  if (!created) {
    loader.dismiss();
    return;
  }

  const { app } = created;

  const pageBounds: PageBounds = {
    x: 0,
    y: 0,
    width: app.screen.width,
    height: app.screen.height,
  };

  const backSprite = new Sprite();
  const frontLayer = new Container();
  const particles = new Container();
  const effectLayer = new Graphics();
  const laserLayer = new Graphics();
  const vignette = new Graphics();

  const pages = createPages(app.canvas, pageBounds, backSprite);

  await Promise.all([fontsReady, loadCatAssets()]).catch(() => undefined);

  await nextDoubleFrame();

  backSprite.roundPixels = true;

  frontLayer.filters = [
    new DropShadowFilter({
      offset: { x: 8, y: 12 },
      blur: 3,
      quality: 4,
      alpha: 0.55,
      color: SHADOW,
    }),
  ];
  frontLayer.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height);

  const laserGlowFilter = new GlowFilter({
    distance: 20,
    outerStrength: 2.4,
    innerStrength: 0.4,
    color: PINK_HOT,
    quality: 0.35,
    alpha: 0.95,
  });
  const laserBloomFilter = new AdvancedBloomFilter({
    threshold: 0.2,
    bloomScale: 1.1,
    brightness: 1.0,
    blur: 6,
    quality: 4,
  });

  laserLayer.filterArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
  laserLayer.filters = [laserBloomFilter, laserGlowFilter];

  const cat = new Cat({ scale: 2, power: 0.9, skid: 0.99 });

  cat.view.filters = [
    new DropShadowFilter({
      offset: { x: 6, y: 10 },
      blur: 2,
      quality: 4,
      alpha: 0.55,
      color: SHADOW,
    }),
  ];

  cat.setPosition(-160, app.screen.height * 0.82);

  app.stage.addChild(
    backSprite,
    frontLayer,
    particles,
    effectLayer,
    cat.shadowView,
    cat.tailView,
    laserLayer,
    cat.view,
    vignette,
  );

  const chunks: PageChunk[] = [];
  const activeChunks: PageChunk[] = [];
  const healingChunks: PageChunk[] = [];
  const sparks: Spark[] = [];
  const trail: TrailPoint[] = [];
  const arrays: ChunkArrays = { chunks, activeChunks, healingChunks };
  const chunkState = createChunkState();

  const laser = createLaser();

  const mouseTarget = {
    x: app.screen.width / 2,
    y: app.screen.height / 2,
  };

  const interaction = createInteraction({
    getFrontSource: () => pages.frontSource,
  });

  // Pixi must not capture pointer events over the live front page or the user
  // cannot select text / focus links. The stage still renders; only its event
  // hit-testing is disabled. config.laserMouse tracks the real cursor via a
  // passive window listener instead of the Pixi pointer.
  app.stage.eventMode = "none";

  if (config.laserMouse) {
    window.addEventListener(
      "pointermove",
      (event) => {
        mouseTarget.x = event.clientX;
        mouseTarget.y = event.clientY;
      },
      { passive: true },
    );
  }

  function rebuildChunks(): void {
    buildChunks(arrays, chunkState, pageBounds, frontLayer, pages.frontSource);
  }

  function resetDamage(): void {
    resetChunks({ arrays, state: chunkState, frontLayer });

    sparks.length = 0;
    trail.length = 0;

    const cx = pageBounds.x + pageBounds.width / 2;
    const cy = pageBounds.y + pageBounds.height / 2;

    seedLaser(laser, cx, cy);
    laser.impactFired = false;
    laser.impactProgress = 0;
    laser.shake = 0;
    laser.prevMouse = config.laserMouse;
    laser.transitionX = 0;
    laser.transitionY = 0;

    cat.setPosition(-160, app.screen.height * 0.82);
  }

  function rebuildSources(): void {
    clearChunks(arrays, chunkState);
    pages.rebuildSources(pageBounds, backSprite);
    interaction.refresh();
    rebuildChunks();
    resetDamage();
  }

  syncBackSprite(backSprite, pageBounds);
  interaction.refresh();
  rebuildChunks();
  redrawVignette(vignette, app.screen.width, app.screen.height);

  seedLaser(
    laser,
    pageBounds.x + pageBounds.width / 2,
    pageBounds.y + pageBounds.height / 2,
  );

  const viewport = createViewport({
    app,
    pageBounds,
    frontLayer,
    laserLayer,
    rebuildSources,
    syncBackSprite: () => syncBackSprite(backSprite, pageBounds),
    redrawVignette: () =>
      redrawVignette(vignette, app.screen.width, app.screen.height),
  });

  viewport.attach();

  const laserDeps = {
    laser,
    pageBounds,
    trail,
    sparks,
    mouseTarget,
    totalChunkCount: () => chunkState.totalChunkCount,
    detachedChunkCount: () => chunkState.detachedChunkCount,
    resetDamage,
  };
  const sliceDeps = {
    arrays,
    state: chunkState,
    pageBounds,
    laser,
    sparks,
    particles,
  };
  const integrateDeps = {
    arrays,
    frontLayer,
    screenHeight: () => app.screen.height,
  };

  app.render();
  await nextDoubleFrame();
  loader.dismiss();

  app.ticker.add((ticker) => {
    const step = ticker.deltaTime;

    interaction.drainDirty();

    updateLaser(laserDeps, step);

    if (
      laser.resetCooldown <= 0 &&
      (laser.startDelay <= 0 || laser.impactFired)
    ) {
      sliceAlongPath(sliceDeps);
    }

    decayTrail(trail, step);
    integrateSparks(sparks, step);

    integrateChunks(integrateDeps, step);
    updateHealing(arrays, chunkState, step);

    const introProgress =
      START_DELAY > 0 ? 1 - laser.startDelay / START_DELAY : 1;

    if (introProgress >= CAT_ENTRY_PROGRESS) {
      cat.update(step, laser.x, laser.y);
    }

    drawLaser(laserLayer, laser, trail, sparks);
  });
})();
