import { Graphics } from "pixi.js";

import {
  PINK,
  PINK_HOT,
  PINK_LIGHT,
  PINK_PALE,
  PINK_SOFT,
  WHITE,
} from "../lib/colors";
import {
  START_DELAY,
  IMPACT_DURATION,
  IMPACT_THRESHOLD,
  TRAIL_MAX_LIFE,
} from "../config/constants";
import type { Laser } from "./laser";
import { clamp, randomBetween, smoothstep } from "../lib/math";

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  life: number;
  size: number;
}

export function decayTrail(trail: TrailPoint[], step: number): void {
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].life -= step;

    if (trail[i].life <= 0) {
      trail.splice(i, 1);
    }
  }
}

export function integrateSparks(sparks: Spark[], step: number): void {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const spark = sparks[i];

    spark.vx *= 0.96;
    spark.vy += 0.18 * step;
    spark.x += spark.vx * step;
    spark.y += spark.vy * step;
    spark.life -= step;

    if (spark.life <= 0) {
      sparks.splice(i, 1);
    }
  }
}

export function redrawVignette(
  vignette: Graphics,
  width: number,
  height: number,
): void {
  vignette
    .clear()
    .rect(0, 0, width, height)
    .fill({ color: 0x000000, alpha: 0.18 });
}

function weightedColor(stops: readonly number[][]): number {
  const roll = Math.random();

  for (const [threshold, color] of stops) {
    if (roll < threshold) return color;
  }

  return stops[stops.length - 1][1];
}

export function emitSparks(
  sparks: Spark[],
  x: number,
  y: number,
  vx: number,
  vy: number,
  count: number,
): void {
  const speed = Math.hypot(vx, vy);

  for (let i = 0; i < count; i++) {
    const angle = Math.atan2(vy, vx) + randomBetween(-1.1, 1.1);
    const burst = randomBetween(1.4, 4.2) + speed * 0.12;
    const color = weightedColor([
      [0.55, PINK],
      [0.85, PINK_SOFT],
      [1, PINK_PALE],
    ]);

    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * burst,
      vy: Math.sin(angle) * burst - randomBetween(0.2, 1.6),
      life: randomBetween(16, 34),
      maxLife: 34,
      size: Math.round(randomBetween(2, 4)),
      color,
    });
  }
}

export function emitRadialBurst(
  sparks: Spark[],
  x: number,
  y: number,
  count: number,
  power: number,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + randomBetween(-0.18, 0.18);
    const burst = power * randomBetween(0.55, 1.4);
    const color = weightedColor([
      [0.45, PINK],
      [0.8, PINK_SOFT],
      [0.95, PINK_PALE],
      [1, WHITE],
    ]);

    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * burst,
      vy: Math.sin(angle) * burst,
      life: randomBetween(22, 46),
      maxLife: 46,
      size: Math.round(randomBetween(2, 5)),
      color,
    });
  }
}

export function pixelRect(
  g: Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number,
): void {
  const s = Math.max(1, Math.round(size));
  const half = Math.floor(s / 2);

  g.rect(Math.round(x) - half, Math.round(y) - half, s, s).fill({
    color,
    alpha,
  });
}

export function drawImpact(
  laserLayer: Graphics,
  laser: Laser,
  x: number,
  y: number,
): void {
  const shockT = laser.impactProgress / IMPACT_DURATION;

  if (shockT >= 1) return;

  const rx = Math.round(x);
  const ry = Math.round(y);

  const ring1Radius = shockT * 130;
  const ring1Alpha = Math.pow(1 - shockT, 1.4) * 0.9;

  if (ring1Alpha > 0.03) {
    laserLayer
      .rect(
        rx - Math.round(ring1Radius),
        ry - Math.round(ring1Radius),
        Math.round(ring1Radius * 2),
        Math.round(ring1Radius * 2),
      )
      .stroke({ width: 3, color: PINK_PALE, alpha: ring1Alpha });

    laserLayer
      .rect(
        rx - Math.round(ring1Radius) - 4,
        ry - Math.round(ring1Radius) - 4,
        Math.round(ring1Radius * 2) + 8,
        Math.round(ring1Radius * 2) + 8,
      )
      .stroke({ width: 2, color: PINK, alpha: ring1Alpha * 0.6 });
  }

  const ring2T = Math.min(1, shockT * 1.6);
  const ring2Radius = ring2T * 80;
  const ring2Alpha = Math.pow(1 - ring2T, 1.6) * 0.75;

  if (ring2Alpha > 0.03) {
    laserLayer
      .rect(
        rx - Math.round(ring2Radius),
        ry - Math.round(ring2Radius),
        Math.round(ring2Radius * 2),
        Math.round(ring2Radius * 2),
      )
      .stroke({ width: 2, color: PINK_HOT, alpha: ring2Alpha });
  }

  const flashT = Math.min(1, shockT * 4);
  const flashAlpha = Math.pow(1 - flashT, 2.2);

  if (flashAlpha > 0.02) {
    pixelRect(laserLayer, x, y, 90, PINK_PALE, 0.3 * flashAlpha);
    pixelRect(laserLayer, x, y, 60, PINK_HOT, 0.55 * flashAlpha);
    pixelRect(laserLayer, x, y, 30, WHITE, 0.9 * flashAlpha);
  }
}

export function drawTargetGlow(
  laserLayer: Graphics,
  x: number,
  y: number,
  intensity: number,
  pulse: number,
): void {
  const scale = intensity * (0.88 + pulse * 0.22);

  pixelRect(laserLayer, x, y, 56 * scale, PINK, 0.22 * intensity);
  pixelRect(laserLayer, x, y, 36 * scale, PINK_HOT, 0.45 * intensity);
  pixelRect(laserLayer, x, y, 20 * scale, PINK_LIGHT, 0.72 * intensity);
  pixelRect(laserLayer, x, y, 10 * scale, PINK_PALE, intensity);
  pixelRect(laserLayer, x, y, 4, WHITE, intensity);
}

interface TrailLayerSpec {
  cutoff: number;
  taperPow: number;
  alphaPow: number;
  alphaMul: number;
  applyShimmer: boolean;
  minAlpha: number;
  width: number;
  color: number;
}

// The trail is three stacked strokes, widest/dimmest first. Each pass walks
// the whole trail before the next starts so a lower layer never paints over
// a brighter upper one; folding them into a single loop would reorder the
// alpha blend and change the look.
const TRAIL_LAYERS: TrailLayerSpec[] = [
  { cutoff: 0.03, taperPow: 0.8, alphaPow: 1.5, alphaMul: 0.4, applyShimmer: true, minAlpha: 0.02, width: 16, color: PINK },
  { cutoff: 0.04, taperPow: 0.9, alphaPow: 1.2, alphaMul: 0.72, applyShimmer: false, minAlpha: 0, width: 7, color: PINK_HOT },
  { cutoff: 0.08, taperPow: 1.1, alphaPow: 0.9, alphaMul: 1, applyShimmer: false, minAlpha: 0, width: 3, color: PINK_PALE },
];

function strokeTrailLayer(
  laserLayer: Graphics,
  trail: TrailPoint[],
  shimmer: number,
  spec: TrailLayerSpec,
): void {
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    const avgLife = ((a.life + b.life) * 0.5) / TRAIL_MAX_LIFE;

    if (avgLife < spec.cutoff) continue;

    const taper = Math.pow(avgLife, spec.taperPow);
    const alpha =
      Math.pow(avgLife, spec.alphaPow) *
      spec.alphaMul *
      (spec.applyShimmer ? shimmer : 1);

    if (alpha <= spec.minAlpha) continue;

    laserLayer
      .moveTo(a.x, a.y)
      .lineTo(b.x, b.y)
      .stroke({ width: spec.width * taper, color: spec.color, alpha });
  }
}

export function drawLaser(
  laserLayer: Graphics,
  laser: Laser,
  trail: TrailPoint[],
  sparks: Spark[],
): void {
  laserLayer.clear();

  const now = performance.now();

  if (trail.length > 1) {
    const shimmer = 0.85 + Math.sin(now * 0.02) * 0.15;

    for (const layer of TRAIL_LAYERS) {
      strokeTrailLayer(laserLayer, trail, shimmer, layer);
    }
  }

  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    const lifeRatio = p.life / TRAIL_MAX_LIFE;

    if (lifeRatio < 0.2) continue;

    const sparkle = 0.75 + Math.sin(p.x * 0.3 + p.y * 0.2) * 0.25;
    const dotSize = Math.max(2, p.size * (0.55 + lifeRatio * 0.5));

    pixelRect(
      laserLayer,
      p.x,
      p.y,
      dotSize,
      WHITE,
      lifeRatio * sparkle * 0.85,
    );
  }

  for (const spark of sparks) {
    const alpha = clamp(spark.life / spark.maxLife, 0, 1);

    pixelRect(laserLayer, spark.x, spark.y, spark.size, spark.color, alpha);
  }

  if (laser.resetCooldown > 0) {
    return;
  }

  const topY = laser.emitterY;
  const shakeMag = laser.shake;
  const shakeX = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
  const shakeY = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;

  if (laser.startDelay > 0) {
    const progress = 1 - laser.startDelay / START_DELAY;
    const emitterIn = smoothstep(0.0, 0.14, progress);
    const chargeIn = smoothstep(0.05, IMPACT_THRESHOLD, progress);
    const reticleIn = smoothstep(0.1, 0.4, progress);
    const reticleOut = smoothstep(0.45, 0.68, progress);
    const reticleAlpha = reticleIn * (1 - reticleOut);
    const beamIn = Math.pow(smoothstep(0.3, IMPACT_THRESHOLD, progress), 0.55);
    const focusIn = smoothstep(IMPACT_THRESHOLD - 0.02, 0.78, progress);
    const pulse = 0.78 + Math.sin(now * 0.009) * 0.22;
    const fastPulse = 0.7 + Math.sin(now * 0.03) * 0.3;

    if (emitterIn > 0.01) {
      const emitterPulse = chargeIn > 0 ? 1 + Math.sin(now * 0.025) * 0.25 : 1;

      pixelRect(
        laserLayer,
        laser.emitterX,
        topY,
        (22 + chargeIn * 10) * emitterIn * emitterPulse,
        PINK,
        0.28 * emitterIn,
      );
      pixelRect(
        laserLayer,
        laser.emitterX,
        topY,
        (12 + chargeIn * 6) * emitterIn * emitterPulse,
        PINK_HOT,
        0.85 * emitterIn,
      );
      pixelRect(
        laserLayer,
        laser.emitterX,
        topY,
        (5 + chargeIn * 3) * emitterIn,
        PINK_PALE,
        emitterIn,
      );
    }

    if (chargeIn > 0.01) {
      for (let i = 0; i < 3; i++) {
        const ringT = (((chargeIn * 2.2 + i * 0.33) % 1) + 1) % 1;
        const ringRadius = 6 + ringT * 44;
        const ringAlpha = (1 - ringT) * 0.8 * chargeIn;

        if (ringAlpha < 0.02) continue;
        laserLayer
          .rect(
            Math.round(laser.emitterX - ringRadius),
            Math.round(topY - ringRadius),
            Math.round(ringRadius * 2),
            Math.round(ringRadius * 2),
          )
          .stroke({
            width: 2,
            color: PINK_HOT,
            alpha: ringAlpha,
          });
      }

      if (Math.random() < 0.35 * chargeIn) {
        const crackleAngle = Math.random() * Math.PI * 2;
        const crackleDist = randomBetween(8, 18);

        sparks.push({
          x: laser.emitterX + Math.cos(crackleAngle) * crackleDist,
          y: topY + Math.sin(crackleAngle) * crackleDist,
          vx: Math.cos(crackleAngle) * randomBetween(0.4, 1.2),
          vy: Math.sin(crackleAngle) * randomBetween(0.4, 1.2),
          life: randomBetween(8, 16),
          maxLife: 16,
          size: 2,
          color: weightedColor([
            [0.5, PINK_LIGHT],
            [1, PINK_PALE],
          ]),
        });
      }
    }

    if (reticleAlpha > 0.01) {
      const size = 10 + (1 - reticleIn) * 60;
      const outer = size + 16;
      const inner = size + 4;
      const ringAlpha = reticleAlpha * fastPulse;
      const rx = Math.round(laser.x);
      const ry = Math.round(laser.y);
      const halfSize = Math.round(size);

      laserLayer
        .rect(rx - halfSize, ry - halfSize, halfSize * 2, halfSize * 2)
        .stroke({ width: 2, color: PINK, alpha: 0.8 * ringAlpha });

      const innerHalf = Math.round(size * 0.55);

      laserLayer
        .rect(rx - innerHalf, ry - innerHalf, innerHalf * 2, innerHalf * 2)
        .stroke({ width: 2, color: PINK_LIGHT, alpha: 0.6 * ringAlpha });

      laserLayer
        .rect(rx - outer, ry - 1, outer - inner, 2)
        .fill({ color: PINK, alpha: 0.85 * ringAlpha });
      laserLayer
        .rect(rx + inner, ry - 1, outer - inner, 2)
        .fill({ color: PINK, alpha: 0.85 * ringAlpha });
      laserLayer
        .rect(rx - 1, ry - outer, 2, outer - inner)
        .fill({ color: PINK, alpha: 0.85 * ringAlpha });
      laserLayer
        .rect(rx - 1, ry + inner, 2, outer - inner)
        .fill({ color: PINK, alpha: 0.85 * ringAlpha });
    }

    if (beamIn > 0.01) {
      const endX = laser.emitterX + (laser.x - laser.emitterX) * beamIn;
      const endY = topY + (laser.y - topY) * beamIn;

      laserLayer
        .moveTo(laser.emitterX, topY)
        .lineTo(endX, endY)
        .stroke({ width: 18, color: PINK, alpha: 0.2 * beamIn });
      laserLayer
        .moveTo(laser.emitterX, topY)
        .lineTo(endX, endY)
        .stroke({ width: 10, color: PINK_HOT, alpha: 0.5 * beamIn });
      laserLayer
        .moveTo(laser.emitterX, topY)
        .lineTo(endX, endY)
        .stroke({ width: 5, color: PINK_PALE, alpha: 0.95 * beamIn });
      laserLayer
        .moveTo(laser.emitterX, topY)
        .lineTo(endX, endY)
        .stroke({ width: 2, color: WHITE, alpha: beamIn });

      if (beamIn < 1) {
        pixelRect(laserLayer, endX, endY, 20, PINK_HOT, 0.45);
        pixelRect(laserLayer, endX, endY, 10, PINK_PALE, 1);
        pixelRect(laserLayer, endX, endY, 4, WHITE, 1);
      }
    }

    if (laser.impactFired) {
      drawImpact(laserLayer, laser, laser.x + shakeX, laser.y + shakeY);
    }

    if (focusIn > 0.01) {
      drawTargetGlow(
        laserLayer,
        laser.x + shakeX,
        laser.y + shakeY,
        focusIn,
        pulse,
      );
    }

    return;
  }

  const targetX = laser.x + shakeX;
  const targetY = laser.y + shakeY;

  laserLayer
    .moveTo(laser.emitterX, topY)
    .lineTo(targetX, targetY)
    .stroke({ width: 16, color: PINK, alpha: 0.18 });

  laserLayer
    .moveTo(laser.emitterX, topY)
    .lineTo(targetX, targetY)
    .stroke({ width: 9, color: PINK_HOT, alpha: 0.48 });

  laserLayer
    .moveTo(laser.emitterX, topY)
    .lineTo(targetX, targetY)
    .stroke({ width: 4, color: PINK_PALE, alpha: 0.95 });

  laserLayer
    .moveTo(laser.emitterX, topY)
    .lineTo(targetX, targetY)
    .stroke({ width: 2, color: WHITE, alpha: 1 });

  const steadyPulse = 0.82 + Math.sin(now * 0.014) * 0.18;

  if (laser.impactFired && laser.impactProgress < IMPACT_DURATION) {
    drawImpact(laserLayer, laser, targetX, targetY);
  }

  drawTargetGlow(laserLayer, targetX, targetY, 1, steadyPulse);

  pixelRect(laserLayer, laser.emitterX, topY, 10, PINK, 0.9);
  pixelRect(laserLayer, laser.emitterX, topY, 5, PINK_PALE, 1);
}
