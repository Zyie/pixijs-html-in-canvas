import { Assets, Container, MeshRope, Point, Sprite, Texture } from "pixi.js";

import { clamp } from "../lib/math";

const CAT_TEXTURE_PATHS = [
  "/assets/cat/body-1.png",
  "/assets/cat/body-2.png",
  "/assets/cat/body-3.png",
  "/assets/cat/body-4.png",
  "/assets/cat/head-centre.png",
  "/assets/cat/head-left-1.png",
  "/assets/cat/head-left-2.png",
  "/assets/cat/head-right-1.png",
  "/assets/cat/head-right-2.png",
  "/assets/cat/front-paw.png",
  "/assets/cat/paw-blur-1.png",
  "/assets/cat/paw-blur-2.png",
  "/assets/cat/paw-blur-3.png",
  "/assets/cat/paw-blur-4.png",
  "/assets/cat/tail.png",
  "/assets/cat/shadow.png",
];

export async function loadCatAssets(): Promise<void> {
  await Promise.all(CAT_TEXTURE_PATHS.map((path) => Assets.load(path)));
}

function smallestAngle(target: number, current: number): number {
  let diff = target - current;

  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;

  return diff;
}

function rotateVectorInto(
  out: { x: number; y: number },
  x: number,
  y: number,
  rotation: number,
): void {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  out.x = x * cos - y * sin;
  out.y = x * sin + y * cos;
}

interface CatTailOptions {
  joints?: number;
  length?: number;
  friction?: number;
  scale?: number;
}

class CatTail {
  view: MeshRope;

  private _scale: number;
  private _joints: number;
  private _linkLength: number;
  private _friction: number;
  private _px: number[] = [];
  private _py: number[] = [];
  private _ox: number[] = [];
  private _oy: number[] = [];
  private _points: Point[] = [];
  private _firstRun = true;

  constructor({
    joints = 12,
    length = 90,
    friction = 0.92,
    scale = 1,
  }: CatTailOptions = {}) {
    this._scale = scale;
    this._joints = joints;
    this._linkLength = length / joints;
    this._friction = friction;

    for (let i = 0; i <= joints; i++) {
      this._px[i] = 0;
      this._py[i] = i * this._linkLength;
      this._ox[i] = this._px[i];
      this._oy[i] = this._py[i];
      this._points.push(new Point(0, (i * this._linkLength) / scale));
    }

    this.view = new MeshRope({
      texture: Texture.from("/assets/cat/tail.png"),
      points: this._points,
      textureScale: 0,
    });
    this.view.scale.set(scale);
  }

  reset(x: number, y: number): void {
    for (let i = 0; i <= this._joints; i++) {
      this._px[i] = x;
      this._py[i] = y + i * this._linkLength;
      this._ox[i] = this._px[i];
      this._oy[i] = this._py[i];
      this._points[i].x = this._px[i] / this._scale;
      this._points[i].y = this._py[i] / this._scale;
    }

    this._firstRun = false;
  }

  update(x: number, y: number): void {
    if (this._firstRun) {
      this.reset(x, y);

      return;
    }

    for (let i = 0; i <= this._joints; i++) {
      const tempX = this._px[i];
      const tempY = this._py[i];

      this._px[i] += this._friction * (this._px[i] - this._ox[i]);
      this._py[i] += this._friction * (this._py[i] - this._oy[i]);
      this._ox[i] = tempX;
      this._oy[i] = tempY;
    }

    for (let iter = 0; iter < 4; iter++) {
      this._px[0] = x;
      this._py[0] = y;

      for (let i = 1; i <= this._joints; i++) {
        const dx = this._px[i] - this._px[i - 1];
        const dy = this._py[i] - this._py[i - 1];
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const diff = (dist - this._linkLength) / dist;
        const offsetX = (diff * dx) / 2;
        const offsetY = (diff * dy) / 2;

        this._px[i] -= offsetX;
        this._py[i] -= offsetY;
        this._px[i - 1] += offsetX;
        this._py[i - 1] += offsetY;
      }
    }

    this._px[0] = x;
    this._py[0] = y;

    for (let i = 0; i <= this._joints; i++) {
      this._points[i].x = this._px[i] / this._scale;
      this._points[i].y = this._py[i] / this._scale;
    }
  }
}

export interface CatOptions {
  scale?: number;
  power?: number;
  skid?: number;
}

export class Cat {
  view = new Container();
  shadowView: Sprite;
  tailView: MeshRope;

  position = { x: 0, y: 0 };
  velocity = { x: 0, y: 0 };
  power: number;
  skid: number;
  scale: number;

  private _bodyFrames: Texture[];
  private _armFrames: Texture[];
  private _headFrames: Texture[];
  private _bodyView: Sprite;
  private _headView: Sprite;
  private _leftPaw: Sprite;
  private _rightPaw: Sprite;
  private _leftArm: Sprite;
  private _rightArm: Sprite;
  private _tail: CatTail;
  private _tick = 0;
  private _easeDirection = 0;
  private _hasEaseDirection = false;
  private _lastTargetX = 0;
  private _lastTargetY = 0;
  private _hasLastTarget = false;
  private _wobbleTime = Math.random() * 1000;

  // Reused per-frame scratch vectors; `rotateVectorInto` fully overwrites
  // each before it is read, so they never carry state across frames.
  private _leftPawOffset = { x: 0, y: 0 };
  private _rightPawOffset = { x: 0, y: 0 };
  private _tailOffset = { x: 0, y: 0 };

  constructor({ scale = 2, power = 0.9, skid = 0.99 }: CatOptions = {}) {
    this.scale = scale;
    this.power = power;
    this.skid = skid;

    this._bodyFrames = ["body-1", "body-2", "body-3", "body-4"].map((name) =>
      Texture.from(`/assets/cat/${name}.png`),
    );
    this._armFrames = [
      "paw-blur-1",
      "paw-blur-2",
      "paw-blur-3",
      "paw-blur-4",
    ].map((name) => Texture.from(`/assets/cat/${name}.png`));
    this._headFrames = [
      "head-left-2",
      "head-left-1",
      "head-centre",
      "head-right-1",
      "head-right-2",
      "head-right-1",
      "head-centre",
      "head-left-1",
    ].map((name) => Texture.from(`/assets/cat/${name}.png`));

    this._bodyView = new Sprite(this._bodyFrames[0]);
    this._bodyView.anchor.set(0.5, 0.2);

    this._headView = new Sprite(this._headFrames[2]);
    this._headView.anchor.set(0.5, 0.7);

    this._leftPaw = new Sprite(Texture.from("/assets/cat/front-paw.png"));
    this._leftPaw.anchor.set(0.5);
    this._rightPaw = new Sprite(Texture.from("/assets/cat/front-paw.png"));
    this._rightPaw.anchor.set(0.5);

    this._leftArm = new Sprite(this._armFrames[0]);
    this._leftArm.anchor.set(0.5, 0);
    this._rightArm = new Sprite(this._armFrames[0]);
    this._rightArm.anchor.set(0.5, 0);

    this.shadowView = new Sprite(Texture.from("/assets/cat/shadow.png"));
    this.shadowView.anchor.set(0.5);
    this.shadowView.alpha = 0.55;
    this.shadowView.scale.set(0.7 * scale, 0.28 * scale);

    this._tail = new CatTail({
      joints: 14,
      length: 38 * scale,
      friction: 0.9,
      scale,
    });
    this.tailView = this._tail.view;

    this.view.scale.set(scale);

    this.view.addChild(
      this._rightPaw,
      this._leftPaw,
      this._bodyView,
      this._leftArm,
      this._rightArm,
      this._headView,
    );
  }

  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.view.x = x;
    this.view.y = y;
    this.shadowView.x = x;
    this.shadowView.y = y + 14 * this.scale;
    this._tail.reset(x, y);
  }

  update(step: number, targetX: number, targetY: number): void {
    const dt = step;

    if (!this._hasLastTarget) {
      this._lastTargetX = targetX;
      this._lastTargetY = targetY;
      this._hasLastTarget = true;
    }

    const laserVX = targetX - this._lastTargetX;
    const laserVY = targetY - this._lastTargetY;

    this._lastTargetX = targetX;
    this._lastTargetY = targetY;

    const catSpeed = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y,
    );
    const catDirX = catSpeed > 0.1 ? this.velocity.x / catSpeed : 0;
    const catDirY = catSpeed > 0.1 ? this.velocity.y / catSpeed : 0;

    this._wobbleTime += dt;

    const wobbleX =
      Math.sin(this._wobbleTime * 0.017) * 110 +
      Math.sin(this._wobbleTime * 0.073) * 40 +
      Math.sin(this._wobbleTime * 0.191) * 15;
    const wobbleY =
      Math.cos(this._wobbleTime * 0.021) * 110 +
      Math.cos(this._wobbleTime * 0.089) * 40 +
      Math.cos(this._wobbleTime * 0.211) * 15;

    const LASER_LEAD = 22;
    const CAT_LEAD = 55;
    const leadX = targetX + laserVX * LASER_LEAD + catDirX * CAT_LEAD + wobbleX;
    const leadY = targetY + laserVY * LASER_LEAD + catDirY * CAT_LEAD + wobbleY;

    let dx = leadX - this.position.x;
    let dy = leadY - this.position.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const maxSpeed = 7 + clamp(len / 500, 0, 1) * 6;

    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    const accX = dx * this.power;
    const accY = dy * this.power;

    this.velocity.x += accX * dt;
    this.velocity.y += accY * dt;

    const friction = Math.pow(this.skid, dt);

    this.velocity.x *= friction;
    this.velocity.y *= friction;

    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y,
    );

    if (speed > maxSpeed && speed > 0) {
      this.velocity.x = (this.velocity.x / speed) * maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * maxSpeed;
    }

    const forwardX = Math.sin(this._bodyView.rotation);
    const forwardY = -Math.cos(this._bodyView.rotation);
    const forwardDot = this.velocity.x * forwardX + this.velocity.y * forwardY;

    if (forwardDot < 0) {
      const REVERSE_DAMP = 0.45;

      this.velocity.x -= forwardX * forwardDot * REVERSE_DAMP;
      this.velocity.y -= forwardY * forwardDot * REVERSE_DAMP;
    }

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;

    const realDX = targetX - this.position.x;
    const realDY = targetY - this.position.y;
    const realLen = Math.sqrt(realDX * realDX + realDY * realDY);
    const rawDirection =
      realLen > 5 ? -Math.atan2(realDX, realDY) : this._easeDirection;

    if (!this._hasEaseDirection) {
      this._easeDirection = rawDirection;
      this._hasEaseDirection = true;
    } else {
      this._easeDirection +=
        smallestAngle(rawDirection, this._easeDirection) * 0.22;
    }

    const direction = this._easeDirection;

    this._animate(this._headView, this._headFrames, 0.5, 0);
    this._animate(this._bodyView, this._bodyFrames, 1, 0);
    this._animate(this._leftArm, this._armFrames, 0.5, 0);
    this._animate(this._rightArm, this._armFrames, 0.5, 2);

    const newBodyAngle =
      direction + Math.PI + Math.sin(this._tick * 0.5) * 0.18;

    this._bodyView.rotation +=
      smallestAngle(newBodyAngle, this._bodyView.rotation) * 0.3;

    const newHeadAngle = direction + Math.PI + Math.cos(this._tick) * 0.06;

    this._headView.rotation +=
      smallestAngle(newHeadAngle, this._headView.rotation) * 0.45;

    this._tick += 0.12 * Math.min(speed, 2) * dt;

    this.view.x = this.position.x;
    this.view.y = this.position.y;
    this.shadowView.x = this.position.x;
    this.shadowView.y = this.position.y + 14 * this.scale;

    rotateVectorInto(this._leftArm, 9, 0, this._bodyView.rotation);
    rotateVectorInto(this._rightArm, -9, 0, this._bodyView.rotation);

    const leftShoulderWorldX = this.position.x + this._leftArm.x * this.scale;
    const leftShoulderWorldY = this.position.y + this._leftArm.y * this.scale;
    const dirLeft = -Math.atan2(
      targetX - leftShoulderWorldX,
      targetY - leftShoulderWorldY,
    );

    const rightShoulderWorldX = this.position.x + this._rightArm.x * this.scale;
    const rightShoulderWorldY = this.position.y + this._rightArm.y * this.scale;
    const dirRight = -Math.atan2(
      targetX - rightShoulderWorldX,
      targetY - rightShoulderWorldY,
    );

    const leftPawOffset = this._leftPawOffset;

    rotateVectorInto(
      leftPawOffset,
      0,
      18 + Math.sin(this._tick) * 3,
      dirLeft + Math.sin(this._tick) * 0.08,
    );
    this._leftPaw.x = this._leftArm.x + leftPawOffset.x;
    this._leftPaw.y = this._leftArm.y + leftPawOffset.y;

    const rightPawOffset = this._rightPawOffset;

    rotateVectorInto(
      rightPawOffset,
      0,
      18 + Math.sin(this._tick + Math.PI) * 3,
      dirRight - Math.sin(this._tick) * 0.08,
    );
    this._rightPaw.x = this._rightArm.x + rightPawOffset.x;
    this._rightPaw.y = this._rightArm.y + rightPawOffset.y;

    const leftStretch = Math.sqrt(
      leftPawOffset.x * leftPawOffset.x + leftPawOffset.y * leftPawOffset.y,
    );

    this._leftArm.height = leftStretch;
    this._leftArm.rotation = -Math.atan2(leftPawOffset.x, leftPawOffset.y);

    const rightStretch = Math.sqrt(
      rightPawOffset.x * rightPawOffset.x + rightPawOffset.y * rightPawOffset.y,
    );

    this._rightArm.height = rightStretch;
    this._rightArm.rotation = -Math.atan2(rightPawOffset.x, rightPawOffset.y);

    this._bodyView.scale.x = 1 + Math.sin(this._tick) * 0.04;
    this._bodyView.scale.y = 1 / this._bodyView.scale.x;

    this._headView.scale.x = 1 + Math.cos(this._tick) * 0.025;
    this._headView.scale.y = this._headView.scale.x;
    this._headView.pivot.y = 1 + Math.cos(this._tick) * 1;

    const tailOffset = this._tailOffset;

    rotateVectorInto(
      tailOffset,
      0,
      14 * this._headView.scale.x,
      this._bodyView.rotation,
    );
    const tailRootX = this.position.x + tailOffset.x * this.scale;
    const tailRootY = this.position.y + tailOffset.y * this.scale;

    this._tail.update(tailRootX, tailRootY);
  }

  private _animate(
    sprite: Sprite,
    frames: Texture[],
    speed: number,
    offset: number,
  ): void {
    const raw = Math.floor((this._tick + offset) * speed);
    const index = ((raw % frames.length) + frames.length) % frames.length;

    sprite.texture = frames[index];
  }
}
