import { config } from "../config/config";
import {
  IMPACT_DURATION,
  IMPACT_THRESHOLD,
  LASER_MODE_BLEND,
  LASER_RAMP_IN_FRAMES,
  START_DELAY,
  TRAIL_MAX_LIFE,
} from "../config/constants";
import { emitRadialBurst } from "./effects";
import type { Spark, TrailPoint } from "./effects";
import { randomBetween, smoothstep } from "../lib/math";
import type { PageBounds } from "../canvas/viewport";

export interface Laser {
  t: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  emitterX: number;
  emitterY: number;
  resetCooldown: number;
  startDelay: number;
  rampIn: number;
  angleSign: number;
  impactFired: boolean;
  impactProgress: number;
  shake: number;
  prevMouse: boolean;
  transitionX: number;
  transitionY: number;
}

export function createLaser(): Laser {
  return {
    t: 0,
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    emitterX: 0,
    emitterY: 0,
    resetCooldown: 0,
    startDelay: START_DELAY,
    rampIn: 0,
    angleSign: 1,
    impactFired: false,
    impactProgress: 0,
    shake: 0,
    prevMouse: false,
    transitionX: 0,
    transitionY: 0,
  };
}

export function computeEmitter(
  laser: Laser,
  targetX: number,
  targetY: number,
  time: number,
): void {
  const angleRad = (config.laserAngle * laser.angleSign * Math.PI) / 180;
  const dirX = Math.sin(angleRad);
  const dirY = Math.cos(angleRad);
  const perpX = -dirY;
  const perpY = dirX;
  const beamLength = Math.max(
    1400,
    Math.hypot(window.innerWidth, window.innerHeight) * 1.6,
  );
  const wander = Math.sin(time * 0.5) * 40;

  laser.emitterX = targetX - dirX * beamLength + perpX * wander;
  laser.emitterY = targetY - dirY * beamLength + perpY * wander;
}

export function seedLaser(laser: Laser, cx: number, cy: number): void {
  laser.t = 0;
  laser.x = cx;
  laser.y = cy;
  laser.prevX = cx;
  laser.prevY = cy;
  laser.angleSign = Math.random() < 0.5 ? -1 : 1;
  computeEmitter(laser, cx, cy, 0);
  laser.startDelay = START_DELAY;
  laser.rampIn = 0;
}

export function triggerImpact(
  laser: Laser,
  sparks: Spark[],
  x: number,
  y: number,
): void {
  laser.impactFired = true;
  laser.impactProgress = 0;
  laser.shake = 8;
  emitRadialBurst(sparks, x, y, 22, 6);
  emitRadialBurst(sparks, x, y, 14, 12);
}

export interface UpdateLaserDeps {
  laser: Laser;
  pageBounds: PageBounds;
  trail: TrailPoint[];
  sparks: Spark[];
  mouseTarget: { x: number; y: number };
  totalChunkCount: () => number;
  detachedChunkCount: () => number;
  resetDamage: () => void;
}

export function updateLaser(deps: UpdateLaserDeps, dt: number): void {
  const { laser, pageBounds, trail, sparks, mouseTarget } = deps;
  const cx = pageBounds.x + pageBounds.width / 2;
  const cy = pageBounds.y + pageBounds.height / 2;

  if (laser.resetCooldown > 0) {
    laser.resetCooldown -= dt;

    if (laser.resetCooldown <= 0) {
      deps.resetDamage();
    }

    laser.prevX = laser.x;
    laser.prevY = laser.y;

    return;
  }

  if (laser.shake > 0) {
    laser.shake = Math.max(0, laser.shake - dt * 0.5);
  }

  if (laser.impactFired) {
    laser.impactProgress = Math.min(IMPACT_DURATION, laser.impactProgress + dt);
  }

  if (laser.startDelay > 0) {
    laser.startDelay -= dt;
    laser.prevX = cx;
    laser.prevY = cy;
    laser.x = cx;
    laser.y = cy;
    laser.rampIn = 0;
    computeEmitter(laser, cx, cy, laser.t);

    const progress = 1 - laser.startDelay / START_DELAY;

    if (!laser.impactFired && progress >= IMPACT_THRESHOLD) {
      triggerImpact(laser, sparks, cx, cy);
    }

    return;
  }

  laser.t += config.laserSpeed * dt;
  laser.rampIn = Math.min(1, laser.rampIn + dt / LASER_RAMP_IN_FRAMES);

  const ramp = smoothstep(0, 1, laser.rampIn);

  laser.prevX = laser.x;
  laser.prevY = laser.y;

  let targetX: number;
  let targetY: number;

  if (config.laserMouse) {
    targetX = cx + (mouseTarget.x - cx) * ramp;
    targetY = cy + (mouseTarget.y - cy) * ramp;
  } else {
    const rx = pageBounds.width * 0.44;
    const ry = pageBounds.height * 0.42;
    const t = laser.t;
    const chaos = config.laserChaos;

    let offsetX = Math.sin(t * 1.12) * rx + Math.sin(t * 0.41) * rx * 0.16;
    let offsetY = Math.sin(t * 0.83) * ry + Math.sin(t * 0.27) * ry * 0.22;

    if (chaos > 0) {
      offsetX += Math.sin(t * 3.73 + 0.7) * rx * 0.22 * chaos;
      offsetX += Math.sin(t * 8.17 + 1.9) * rx * 0.12 * chaos;
      offsetY += Math.cos(t * 4.21 + 2.3) * ry * 0.22 * chaos;
      offsetY += Math.cos(t * 9.31 + 0.5) * ry * 0.12 * chaos;
    }

    targetX = cx + offsetX * ramp;
    targetY = cy + offsetY * ramp;
  }

  if (config.laserMouse !== laser.prevMouse) {
    laser.transitionX = laser.x - targetX;
    laser.transitionY = laser.y - targetY;
    laser.prevMouse = config.laserMouse;
  }

  const transitionDecay = Math.pow(LASER_MODE_BLEND, dt);

  laser.transitionX *= transitionDecay;
  laser.transitionY *= transitionDecay;

  if (config.laserMouse) {
    const rate = 1 - config.laserMouseSmoothness;
    const factor = 1 - Math.pow(1 - rate, dt);
    const desiredX = targetX + laser.transitionX;
    const desiredY = targetY + laser.transitionY;

    laser.x += (desiredX - laser.x) * factor;
    laser.y += (desiredY - laser.y) * factor;
  } else {
    laser.x = targetX + laser.transitionX;
    laser.y = targetY + laser.transitionY;
  }

  computeEmitter(laser, laser.x, laser.y, laser.t);

  trail.push({
    x: laser.x,
    y: laser.y,
    life: TRAIL_MAX_LIFE,
    size: randomBetween(3, 5),
  });

  if (trail.length > 180) {
    trail.splice(0, trail.length - 180);
  }

  const total = deps.totalChunkCount();

  if (total > 0 && deps.detachedChunkCount() / total > 0.9) {
    laser.resetCooldown = 160;
  }
}
