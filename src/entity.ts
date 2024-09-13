import * as m from "./math";
import * as r from "./graphics";
import Scene from "./scene";
import { SCREEN_OPTS } from "./config";

export enum EntityType {
  "entity",
  "projectile",
  "hitbox",
  "enemy",
  "player",
}

export default class Entity {
  alive = true;
  age = 0;
  scene: Scene;

  // Center position
  pos: Vector = [0, 0];

  moveDir: Vector = [0, 0];
  baseSpeed: number = 0;
  speedFactor: number = 1;

  angle = 0;

  // Enable collisions
  solid = true;

  constructor(scene: Scene) {
    this.scene = scene;
    this.scene.add(this);
  }

  get type(): EntityType {
    return EntityType.entity;
  }

  get size(): Vector {
    return [0, 0];
  }

  get x() {
    return this.pos[0];
  }
  get y() {
    return this.pos[1];
  }

  get w() {
    return this.size[0];
  }
  get h() {
    return this.size[1];
  }

  get rect(): [number, number, number, number] {
    return [this.x - this.w / 2, this.y - this.h / 2, this.w, this.h];
  }

  get isOutOfMap(): boolean {
    const [centerX, centerY] = this.pos;
    const [w, h] = this.size.map((e) => e * 0.5);

    return (
      centerX - w <= 0 ||
      centerX + w >= this.scene.mapW ||
      centerY - h <= 0 ||
      centerY + h >= this.scene.mapH
    );
  }

  resize(ratio: number) {}

  remove() {
    this.alive = false;
    this.scene.remove(this);
  }

  move(dt: number) {
    const speedScale = this.baseSpeed * this.speedFactor * dt;
    const moveVector = m.scale(this.moveDir, speedScale);

    this.pos = m.add(this.pos, moveVector);
  }

  update(dt: number) {
    this.age += dt;
  }

  render(ctx: Ctx) {}

  drawCollisionBox(ctx: Ctx) {
    if (!this.solid) {
      return;
    }

    ctx.save();

    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.strokeRect(...this.rect);

    ctx.translate(...this.pos);
    r.circle(ctx, 2, "red");

    ctx.restore();
  }
}
