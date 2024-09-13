import * as audio from "./audio";
import { DEFAULT_CHARACTER_SIZE, SCREEN_OPTS } from "./config";
import Enemy from "./enemy";
import Entity from "./entity";
import * as r from "./graphics";
import * as m from "./math";
import Scene from "./scene";
import { CharacterState, Dying, Idle } from "./state";
import TextIndicator from "./text_indicator";
import { CHARACTER_UPGRADES, MAX_LEVEL, PLAYER_UPGRADES } from "./upgrades";
import { scaleToTileSize } from "./utils";
import { Bow, Shield, Sword, Weapon } from "./weapon";

export const HEAD_IDX = 0;
export const BODY_IDX = 1;
export const ARMS_IDX = 2;
export const LEG_IDX = 3;

type KnockbackEffect = {
  dir: Vector;
  startedAt: number;
  duration: number;
};

// ? Toggle for friendly fire?
export default class Character extends Entity {
  ctrl: Controller;

  baseSpeed: number;
  lockFacingDir = false;
  facingDir = 1;

  level = 0;
  state: CharacterState = new Idle();
  color: string = "white";

  stamina: number;
  maxStamina = CHARACTER_UPGRADES.maxStamina[0];
  staminaRegenStep = 2;
  lastStaminaUse = 0;

  hp: number;
  maxHp = CHARACTER_UPGRADES.maxHp[0];
  hpRegenStep = 1;

  hpRegenCD = 1;
  staminaRegenCD = 2;

  lastDamage = 0;
  invencibilityPeriod = 0.1;

  rolling = false;
  lastRoll = -1;
  rollCooldown = 0.125;
  rollStaminaCost = 5;

  items: Weapon[] = [new Sword(), new Bow(), new Shield()];
  currItem = 0;

  defenseFactor = 0;
  baseDefense = 1;

  opacity: number = 1;
  sizeRatios = DEFAULT_CHARACTER_SIZE;
  characterSizes!: CharacterSizeOpts;
  _size: Vector = [0, 0];

  knockback?: KnockbackEffect;

  constructor(
    pos: Vector,
    ctrl: Controller,
    scene: Scene,
    color: string = "white"
  ) {
    super(scene);
    this.pos = pos;
    this.ctrl = ctrl;
    this.color = color;

    this.stamina = this.maxStamina;
    this.hp = this.maxHp;

    this.baseSpeed = CHARACTER_UPGRADES.baseSpeed[0] * SCREEN_OPTS.tileSize;

    this.resize(1);
  }

  get isIdle(): boolean {
    return (
      this.speedFactor === 0 ||
      (this.ctrl.direction[0] === 0 && this.ctrl.direction[1] === 0)
    );
  }

  get size(): Vector {
    return this._size;
  }

  get canRoll(): boolean {
    return (
      !this.isIdle &&
      !this.rolling &&
      this.stamina >= this.rollStaminaCost &&
      this.age - this.lastRoll > this.rollCooldown
    );
  }

  get weapon(): Weapon {
    return this.items[this.currItem];
  }

  get canUseWeapon(): boolean {
    return this.weapon.canUse(this);
  }

  get totalLevel(): number {
    return this.items.reduce((prev, acc) => prev + acc.level, this.level);
  }

  resize(ratio: number) {
    this.characterSizes = this.sizeRatios.map(
      scaleToTileSize
    ) as CharacterSizeOpts;
    this.baseSpeed *= ratio;

    this._size = [
      this.characterSizes[BODY_IDX][0],
      this.characterSizes[BODY_IDX][1] +
        this.characterSizes[HEAD_IDX][1] +
        this.characterSizes[LEG_IDX][1],
    ];
  }

  takeDamage(damage: number, attacker: Entity) {
    if (this.hp > 0 && this.age - this.lastDamage > this.invencibilityPeriod) {
      const defense = this.defenseFactor * this.baseDefense;
      let totalDamage = Math.max(0.25, damage - defense);

      if (totalDamage >= this.hp) {
        totalDamage = Math.floor(this.hp);
      }

      this.hp = Math.floor(this.hp - totalDamage);
      this.lastDamage = this.age;

      // TODO: Adjust knockback duration/strength and move it to a function here instead of using a state, so player can continue attacking
      const dir = m.norm(m.sub(this.pos, attacker.pos));
      const knockbackDir = m.scale(dir, 1.25);

      this.knockback = {
        dir: knockbackDir,
        duration: 0.25,
        startedAt: this.age,
      };

      // this.changeState(new Knockback(knockbackDir, 0.25));
      this.scene.dispatchEvent("CHARACTER_DAMAGE", {
        totalDamage,
        pos: this.pos,
      });

      new TextIndicator(
        this.scene,
        this.pos,
        TextIndicator.damageOpts(totalDamage)
      );
      audio.damage();
    }

    if (this.hp <= 0) {
      this.changeState(new Dying());
      if (attacker instanceof Enemy) {
        attacker.target = undefined;
      }
    }
  }

  die() {
    this.remove();
  }

  changeState(newState: CharacterState) {
    this.state.exit(this);

    newState.enter(this);
    this.state = newState;
  }

  lookAt([x]: Vector) {
    this.facingDir = this.x >= x ? -1 : 1;
  }

  upgrade() {
    this.level++;
    const prog = this.level / MAX_LEVEL;

    this.baseSpeed = m.lerp(...PLAYER_UPGRADES.baseSpeed, prog);
    this.maxHp = m.lerp(...PLAYER_UPGRADES.maxHp, prog);
    this.hp = this.maxHp;

    this.maxStamina = m.lerp(...PLAYER_UPGRADES.maxStamina, prog);
    this.stamina = this.maxStamina;
  }

  move(dt: number): void {
    const oldPos = this.pos;

    if (this.knockback) {
      const { dir, duration, startedAt } = this.knockback;
      if (this.age - startedAt < duration) {
        const knockbackForce = m.lerp(4, 2, this.level / (12 + 1));
        this.pos = m.add(
          this.pos,
          m.scale(dir, SCREEN_OPTS.tileSize * knockbackForce * dt)
        );
      } else {
        this.knockback = undefined;
      }
    } else {
      super.move(dt);
    }

    if (this.isOutOfMap) {
      this.pos = oldPos;
    }
  }

  regen(dt: number) {
    if (
      this.stamina < this.maxStamina &&
      this.age - this.lastStaminaUse > this.staminaRegenCD
    ) {
      this.stamina = Math.min(
        this.stamina + this.staminaRegenStep * dt,
        this.maxStamina
      );
    }
    if (this.hp < this.maxHp && this.age - this.lastDamage > this.hpRegenCD) {
      this.hp = Math.min(this.hp + this.hpRegenStep * dt, this.maxHp);
    }
  }

  update(dt: number): void {
    super.update(dt);

    this.moveDir = this.ctrl.direction;
    this.state.update(this, dt);

    if (!this.lockFacingDir && this.moveDir[0] !== 0) {
      this.facingDir = Math.sign(this.moveDir[0]);
    }

    this.move(dt);
    this.regen(dt);
  }

  render(ctx: Ctx): void {
    ctx.save();

    ctx.globalAlpha = this.opacity;

    ctx.translate(...this.pos);
    this.drawStatusBars(ctx);

    ctx.rotate(this.angle);
    this.drawArms(ctx);
    this.drawBody(ctx);
    this.drawHead(ctx);
    this.drawLegs(ctx);

    this.weapon.active && this.weapon.render(ctx);

    ctx.restore();
  }

  drawBody(ctx: Ctx) {
    ctx.save();

    const [w, h] = this.characterSizes[BODY_IDX];
    r.rect(ctx, {
      w,
      h,
      fill: this.color,
      stroke: "black",
      strokeWidth: 0.5,
    });
    // r.circle(ctx, 2, "red");
    if (this.color === "black") {
      ctx.fillStyle = "red";
    }
    ctx.font = `${w * 0.5}px Roboto`;
    ctx.textAlign = "center";
    ctx.fillText(this.totalLevel.toString(), 0, 0);

    if (this.age > 1 && this.age - this.lastDamage < this.invencibilityPeriod) {
      r.rect(ctx, {
        w,
        h,
        fill: "red",
        opacity: 0.5,
      });
    }

    ctx.restore();
  }

  drawHead(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const [w, h] = this.characterSizes[HEAD_IDX];
    const [_, bodyH] = this.characterSizes[BODY_IDX];

    ctx.translate(0, -bodyH * 0.5 - h * 0.5);

    if (this.rolling) {
      // Hide head when rolling
      ctx.translate(0, h * 0.5);
    }

    r.rect(ctx, {
      w,
      h,
      fill: "grey",
      strokeWidth: 0.5,
      stroke: "black",
    });

    ctx.restore();
  }

  drawArms(ctx: Ctx) {
    ctx.save();

    const armOffset = m.lerpMinMaxMin(3, 8, (this.age % 2) / 2);
    ctx.translate(0, armOffset);

    this._drawArm(ctx);
    ctx.scale(-1, 1);
    this._drawArm(ctx);

    ctx.restore();
  }

  _drawArm(ctx: Ctx) {
    const [w, h] = this.characterSizes[ARMS_IDX];
    const [bodyW, bodyH] = this.characterSizes[BODY_IDX];

    ctx.save();
    ctx.translate(-bodyW / 1.5 + w * 0.5, -bodyH * 0.5);

    ctx.rotate(Math.PI / 8);

    ctx.fillStyle = "grey";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.5;

    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
  }

  drawLegs(ctx: Ctx) {
    const maxOffset = 4;
    const offsetSpeed = 0.55 / this.speedFactor;

    const moveLegs = !this.isIdle && !this.rolling && !this.scene.paused;
    const legOffsetY = moveLegs
      ? m.lerpMinMaxMin(0, maxOffset, (this.age % offsetSpeed) / offsetSpeed)
      : 0;

    ctx.save();
    ctx.translate(0, -legOffsetY);
    this._drawLeg(ctx);

    ctx.scale(-1, 1);
    if (moveLegs) {
      ctx.translate(0, -maxOffset + legOffsetY * 2);
    }
    this._drawLeg(ctx);
    ctx.restore();
  }

  _drawLeg(ctx: Ctx) {
    const [w, h] = this.characterSizes[LEG_IDX];
    const [bodyW, bodyH] = this.characterSizes[BODY_IDX];
    const legOffsetX = Math.abs(w - h) * 0.25;

    ctx.save();
    ctx.translate(-bodyW * 0.5 + legOffsetX, bodyH * 0.5);

    if (this.rolling) {
      // Raise legs when rolling
      ctx.translate(0, -h * 0.5);
    }

    ctx.fillStyle = "grey";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.5;

    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
  }

  drawStatusBars(ctx: Ctx) {
    if (this.hp <= 0) {
      return;
    }

    ctx.save();

    const [w, h] = this.size;
    const barWidth = w;
    const barHeight = SCREEN_OPTS.tileSize * 0.15;

    ctx.globalAlpha = 0.8;

    ctx.save();
    ctx.translate(0, h * 0.5 + barHeight * 2);
    const staminaPercent = this.stamina / this.maxStamina;
    if (staminaPercent < 1) {
      r.progressBar(ctx, barWidth, barHeight, staminaPercent, "green");
    }

    const healthPercent = this.hp / this.maxHp;
    if (healthPercent < 1) {
      ctx.translate(0, barHeight * 1.5);
      r.progressBar(ctx, barWidth, barHeight, healthPercent, "red");
    }
    ctx.restore();

    ctx.restore();
  }

  drawWeaponReach(ctx: Ctx) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    r.circle(ctx, this.weapon.reach, undefined, "black");
    ctx.restore();
  }
}
