import { Container, HTMLSource, Rectangle, Sprite, Texture } from "pixi.js";

import { config } from "../config/config";
import { HEAL_FADE_TICKS, HEAL_HOLD_TICKS } from "../config/constants";
import { emitSparks, type Spark } from "./effects";
import type { Laser } from "./laser";
import { clamp, randomBetween } from "../lib/math";
import type { PageBounds } from "../canvas/viewport";

export interface PageChunk {
  sprite: Sprite;
  texture: Texture;
  localX: number;
  localY: number;
  width: number;
  height: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  vr: number;
  gravity: number;
  drag: number;
  age: number;
  exploded: boolean;
  healing: boolean;
  healProgress: number;
}

// Shared with the laser (detach ratio) and the slicer (column/row bounds).
export interface ChunkState {
  totalChunkCount: number;
  detachedChunkCount: number;
  chunkCols: number;
  chunkRows: number;
}

export function createChunkState(): ChunkState {
  return {
    totalChunkCount: 0,
    detachedChunkCount: 0,
    chunkCols: 0,
    chunkRows: 0,
  };
}

export interface ChunkArrays {
  chunks: PageChunk[];
  activeChunks: PageChunk[];
  healingChunks: PageChunk[];
}

export function chunkIntersectsCircle(
  chunk: PageChunk,
  x: number,
  y: number,
  radius: number,
): boolean {
  const nearestX = clamp(x, chunk.localX, chunk.localX + chunk.width);
  const nearestY = clamp(y, chunk.localY, chunk.localY + chunk.height);
  const dx = x - nearestX;
  const dy = y - nearestY;

  return dx * dx + dy * dy <= radius * radius;
}

export function syncBackSprite(
  backSprite: Sprite,
  pageBounds: PageBounds,
): void {
  backSprite.position.set(pageBounds.x, pageBounds.y);
  backSprite.width = pageBounds.width;
  backSprite.height = pageBounds.height;
}

export function destroyChunk(chunk: PageChunk): void {
  chunk.sprite.parent?.removeChild(chunk.sprite);
  chunk.sprite.destroy();
  chunk.texture.destroy(false);
}

export function clearChunks(arrays: ChunkArrays, state: ChunkState): void {
  for (const chunk of arrays.chunks) {
    destroyChunk(chunk);
  }

  arrays.chunks.length = 0;
  arrays.activeChunks.length = 0;
  arrays.healingChunks.length = 0;
  state.totalChunkCount = 0;
  state.detachedChunkCount = 0;
}

export function buildChunks(
  arrays: ChunkArrays,
  state: ChunkState,
  pageBounds: PageBounds,
  frontLayer: Container,
  frontSource: HTMLSource,
): void {
  clearChunks(arrays, state);

  const size = config.chunkSize;

  state.chunkCols = Math.ceil(pageBounds.width / size);
  state.chunkRows = Math.ceil(pageBounds.height / size);

  for (let row = 0; row < state.chunkRows; row++) {
    const y = row * size;
    const frameHeight = Math.min(size, pageBounds.height - y);

    for (let col = 0; col < state.chunkCols; col++) {
      const x = col * size;
      const frameWidth = Math.min(size, pageBounds.width - x);
      const texture = new Texture({
        source: frontSource,
        frame: new Rectangle(x, y, frameWidth, frameHeight),
      });
      const sprite = new Sprite(texture);
      const homeX = pageBounds.x + x + frameWidth / 2;
      const homeY = pageBounds.y + y + frameHeight / 2;

      sprite.anchor.set(0.5);
      sprite.position.set(homeX, homeY);
      sprite.roundPixels = true;
      frontLayer.addChild(sprite);

      arrays.chunks.push({
        sprite,
        texture,
        localX: x,
        localY: y,
        width: frameWidth,
        height: frameHeight,
        homeX,
        homeY,
        vx: 0,
        vy: 0,
        vr: 0,
        gravity: 0,
        drag: 1,
        age: 0,
        exploded: false,
        healing: false,
        healProgress: 0,
      });
    }
  }

  state.totalChunkCount = arrays.chunks.length;
  state.detachedChunkCount = 0;
}

export interface SliceDeps {
  arrays: ChunkArrays;
  state: ChunkState;
  pageBounds: PageBounds;
  laser: Laser;
  sparks: Spark[];
  particles: Container;
}

export function sliceAlongPath(deps: SliceDeps): void {
  const { arrays, state, pageBounds, laser, sparks, particles } = deps;
  const { chunks, activeChunks, healingChunks } = arrays;
  const steps = 4;
  const radius = config.laserRadius;
  const size = config.chunkSize;

  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    const px = laser.prevX + (laser.x - laser.prevX) * t;
    const py = laser.prevY + (laser.y - laser.prevY) * t;
    const localX = px - pageBounds.x;
    const localY = py - pageBounds.y;

    if (
      localX < -radius ||
      localX > pageBounds.width + radius ||
      localY < -radius ||
      localY > pageBounds.height + radius
    ) {
      continue;
    }

    const vx = laser.x - laser.prevX;
    const vy = laser.y - laser.prevY;
    const minCol = Math.max(0, Math.floor((localX - radius) / size));
    const maxCol = Math.min(
      state.chunkCols - 1,
      Math.floor((localX + radius) / size),
    );
    const minRow = Math.max(0, Math.floor((localY - radius) / size));
    const maxRow = Math.min(
      state.chunkRows - 1,
      Math.floor((localY + radius) / size),
    );
    let hits = 0;

    for (let row = minRow; row <= maxRow; row++) {
      const rowOffset = row * state.chunkCols;

      for (let col = minCol; col <= maxCol; col++) {
        const chunk = chunks[rowOffset + col];

        if (!chunk || chunk.exploded) {
          continue;
        }

        if (!chunkIntersectsCircle(chunk, localX, localY, radius)) {
          continue;
        }

        chunk.exploded = true;

        if (chunk.healing) {
          const healIndex = healingChunks.indexOf(chunk);

          if (healIndex !== -1) {
            healingChunks.splice(healIndex, 1);
          }

          chunk.healing = false;
          chunk.healProgress = 0;
          chunk.sprite.alpha = 1;
        } else {
          state.detachedChunkCount++;
        }

        hits++;

        const dx = chunk.homeX - px;
        const dy = chunk.homeY - py;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const pressure = 1 - clamp(distance / radius, 0, 1);
        const angle = Math.atan2(dy, dx) + randomBetween(-0.32, 0.32);
        const force = randomBetween(1.8, 4.2) + pressure * 3.4;

        chunk.vx = Math.cos(angle) * force + vx * 0.45;
        chunk.vy =
          Math.sin(angle) * force + vy * 0.45 - randomBetween(1.2, 4.2);
        chunk.vr = randomBetween(-0.25, 0.25);
        chunk.gravity = randomBetween(0.32, 0.58);
        chunk.drag = randomBetween(0.984, 0.994);
        chunk.age = 0;
        chunk.sprite.alpha = 1;
        chunk.sprite.parent?.removeChild(chunk.sprite);
        particles.addChild(chunk.sprite);
        activeChunks.push(chunk);
      }
    }

    if (hits > 0 && Math.random() < 0.6) {
      emitSparks(sparks, px, py, vx, vy, Math.min(8, 2 + Math.floor(hits / 3)));
    }
  }
}

function resetChunkMotion(chunk: PageChunk): void {
  chunk.vx = 0;
  chunk.vy = 0;
  chunk.vr = 0;
  chunk.gravity = 0;
  chunk.drag = 1;
  chunk.age = 0;
  chunk.exploded = false;
}

export interface ResetChunksDeps {
  arrays: ChunkArrays;
  state: ChunkState;
  frontLayer: Container;
}

export function resetChunks(deps: ResetChunksDeps): void {
  const { arrays, state, frontLayer } = deps;

  for (const chunk of arrays.chunks) {
    chunk.sprite.parent?.removeChild(chunk.sprite);
    chunk.sprite.position.set(chunk.homeX, chunk.homeY);
    chunk.sprite.rotation = 0;
    chunk.sprite.alpha = 1;
    chunk.sprite.visible = true;
    chunk.sprite.scale.set(1);
    resetChunkMotion(chunk);
    chunk.healing = false;
    chunk.healProgress = 0;
    frontLayer.addChild(chunk.sprite);
  }

  arrays.activeChunks.length = 0;
  arrays.healingChunks.length = 0;
  state.detachedChunkCount = 0;
}

export interface IntegrateChunksDeps {
  arrays: ChunkArrays;
  frontLayer: Container;
  screenHeight: () => number;
}

// Per-frame physics for detached chunks: gravity/drag integration, then
// heal-recycle once spent.
export function integrateChunks(deps: IntegrateChunksDeps, step: number): void {
  const { arrays, frontLayer } = deps;
  const screenHeight = deps.screenHeight();
  const { activeChunks, healingChunks } = arrays;

  for (let i = activeChunks.length - 1; i >= 0; i--) {
    const chunk = activeChunks[i];

    chunk.age += step;
    chunk.vy += chunk.gravity * step;
    chunk.vx *= chunk.drag;
    chunk.vy *= chunk.drag;
    chunk.sprite.x += chunk.vx * step;
    chunk.sprite.y += chunk.vy * step;
    chunk.sprite.rotation += chunk.vr * step;

    if (chunk.sprite.y > screenHeight + 180 || chunk.age > 90) {
      activeChunks.splice(i, 1);

      chunk.sprite.parent?.removeChild(chunk.sprite);
      frontLayer.addChild(chunk.sprite);
      chunk.sprite.position.set(chunk.homeX, chunk.homeY);
      chunk.sprite.rotation = 0;
      chunk.sprite.visible = true;
      resetChunkMotion(chunk);

      chunk.sprite.alpha = 0;
      chunk.healing = true;
      chunk.healProgress = 0;
      healingChunks.push(chunk);
    }
  }
}

// Per-frame heal animation: hold invisible for the configured duration, then
// fade back in, returning the chunk to the intact grid.
export function updateHealing(
  arrays: ChunkArrays,
  state: ChunkState,
  step: number,
): void {
  const { healingChunks } = arrays;

  if (healingChunks.length === 0) {
    return;
  }

  for (let i = healingChunks.length - 1; i >= 0; i--) {
    const chunk = healingChunks[i];

    chunk.healProgress += step;

    if (chunk.healProgress < HEAL_HOLD_TICKS) {
      chunk.sprite.alpha = 0;
    } else {
      const fadeProgress = chunk.healProgress - HEAL_HOLD_TICKS;
      chunk.sprite.alpha = Math.min(fadeProgress / HEAL_FADE_TICKS, 1);
    }

    const completeAt = HEAL_HOLD_TICKS + HEAL_FADE_TICKS;

    if (chunk.healProgress >= completeAt) {
      chunk.sprite.alpha = 1;
      chunk.healing = false;
      chunk.healProgress = 0;
      healingChunks.splice(i, 1);
      state.detachedChunkCount = Math.max(0, state.detachedChunkCount - 1);
    }
  }
}
