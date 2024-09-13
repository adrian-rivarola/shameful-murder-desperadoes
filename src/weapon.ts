import Character from "./character";
import { WEAPON_OPTS } from "./config";
import { COLORS } from "./constants";
import * as r from "./graphics";
import * as m from "./math";
import {
  BOW_UPGRADES,
  MAX_LEVEL,
  SHIELD_UPGRADES,
  SWORD_UPGRADES,
} from "./upgrades";

const INITIAL_BOW_DAMAGE = BOW_UPGRADES.damage[0];

// ?: Make weapons entities
export interface Weapon {
  level: number;
  damage: number;
  active: boolean;

  reach: number;
  multiShot?: boolean;
  autoSwing?: boolean;
  coolDown: number;
  lastUse: number;

  offset: Vector;
  offsetAngle?: number | undefined;

  w?: number | undefined;
  h?: number | undefined;
  angle?: number;

  canUse(c: Character): boolean;
  upgrade(): void;

  render(ctx: Ctx): void;
}

// ?: Zenith effect?
export class Sword implements Weapon {
  level = 0;
  active: boolean = false;
  damage = SWORD_UPGRADES.damage[0];

  coolDown = 0.125;
  lastUse = 0;

  autoSwing = false;
  multiShot = false;
  maxAngle = SWORD_UPGRADES.maxAngle[0];
  attackDuration = 0.35;

  color = COLORS.sword;

  sizeFactor = 1;
  offsetAngle = 0;
  offset: Vector = [0, 0];
  offsetRange: Vector = [0, 0];
  swingDir: number = 1;

  get size(): Vector {
    return m.scale(WEAPON_OPTS.swordSize, this.sizeFactor);
  }

  get reach() {
    return Math.abs(this.offset[1]) + this.size[1];
  }

  get h() {
    return this.size[1];
  }

  canUse(c: Character): boolean {
    return this.lastUse + this.coolDown < c.age;
  }

  upgrade() {
    this.level++;

    const prog = this.level / MAX_LEVEL;
    this.multiShot = prog >= 0.5;
    this.autoSwing = prog >= 1;

    if (prog < 1) {
      this.damage = Math.round(m.lerp(...SWORD_UPGRADES.damage, prog));
      this.maxAngle = m.lerp(...SWORD_UPGRADES.maxAngle, prog);
      this.sizeFactor = m.lerp(...SWORD_UPGRADES.sizeFactor, prog);
    } else {
      this.damage += 0.25;
    }
  }

  render(ctx: Ctx) {
    this.active && this.drawSwingEffect(ctx);

    ctx.save();

    ctx.rotate(this.offsetAngle);
    ctx.translate(...this.offset);

    const [swordWidth, swordHeight] = this.size;
    const handleHeight = swordHeight * 0.25;
    const handleWidth = handleHeight * 0.25;

    ctx.save();
    ctx.translate(-swordWidth * 0.5, -swordHeight);
    r.rect(ctx, {
      w: swordWidth,
      h: swordHeight,
      fill: this.color,
      stroke: "black",
      strokeWidth: 1,
      center: false,
    });

    // Handle
    ctx.fillStyle = "black";
    ctx.translate(0, swordHeight - handleHeight);
    ctx.fillRect(0, 0, swordWidth, handleHeight);
    ctx.restore();

    ctx.fillStyle = "black";
    ctx.translate(-swordWidth - handleWidth, -handleHeight);
    ctx.fillRect(0, 0, handleHeight + swordWidth, handleWidth);

    ctx.restore();
  }

  // TODO: Keep this effect after attach finishes and improve effect for max level
  drawSwingEffect(ctx: Ctx) {
    const [swordWidth, swordHeight] = this.size;

    for (let i = 0; i < 1; i += 0.1 / this.level) {
      ctx.save();

      const angle = m.lerp(this.offsetAngle, this.offsetRange[1], i);
      ctx.rotate(angle);
      ctx.translate(...this.offset);

      ctx.translate(-swordWidth, -swordHeight);
      ctx.globalAlpha = m.lerp(0.125, 0.075, i);
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, swordWidth * 2, swordHeight);

      ctx.restore();
    }
  }
}

export class Bow implements Weapon {
  multiShot?: boolean | undefined;
  autoSwing?: boolean | undefined;
  w?: number | undefined;
  h?: number | undefined;
  level = 0;
  active: boolean = false;
  damage = INITIAL_BOW_DAMAGE;

  reach = 200;
  coolDown = 0.75;
  lastUse = 0;

  projectileSpeed = BOW_UPGRADES.projectileSpeed[0];

  offsetAngle = 0;
  offset: Vector = [0, 0];

  angle = 0;

  get size(): Vector {
    return WEAPON_OPTS.bowdSize;
  }

  canUse(c: Character): boolean {
    return this.lastUse + this.coolDown < c.age;
  }

  upgrade() {
    this.level++;

    const prog = this.level / MAX_LEVEL;

    if (prog <= 1) {
      this.damage = Math.round(m.lerp(...BOW_UPGRADES.damage, prog));
      this.projectileSpeed = m.lerp(...BOW_UPGRADES.projectileSpeed, prog);
      this.coolDown = m.lerp(...BOW_UPGRADES.coolDown, prog);
    } else {
      this.projectileSpeed += 2.5;
      this.damage += 0.25;
    }
  }

  render(ctx: Ctx) {
    ctx.save();

    ctx.rotate(this.offsetAngle);
    ctx.translate(...this.offset);

    ctx.rotate(this.angle);

    ctx.save();
    ctx.strokeStyle = "brown";
    ctx.lineWidth = this.size[0];
    this.drawHalf(ctx);
    ctx.scale(1, -1);
    this.drawHalf(ctx);
    ctx.restore();

    r.circle(ctx, 2, "lime");

    ctx.restore();
  }

  drawHalf(ctx: Ctx) {
    const curveOffset = this.size[1] * 0.25;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -this.size[1] * 0.5);
    ctx.lineTo(curveOffset, -this.size[1] * 0.5 - curveOffset);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}

export class Shield implements Weapon {
  level = 0;
  active = false;
  damage = 0;
  offsetAngle = 0;
  offset: Vector = [0, 0];

  angle = 0;

  speedFactor = 0.3;
  defenseFactor = 1;
  reach = 0;
  coolDown = 2;
  lastUse = 0;

  get size(): Vector {
    return WEAPON_OPTS.shieldSize;
  }

  get w(): number {
    return this.size[0];
  }

  get h(): number {
    return this.size[1];
  }

  canUse(c: Character): boolean {
    return this.lastUse + this.coolDown < c.age;
  }

  upgrade(): void {
    this.level++;

    const prog = this.level / MAX_LEVEL;
    this.speedFactor = Math.max(
      1,
      m.lerp(...SHIELD_UPGRADES.speedFactor, prog)
    );
    if (prog < 1) {
      this.defenseFactor = m.lerp(...SHIELD_UPGRADES.defenseFactor, prog);
    }
  }

  render(ctx: Ctx) {
    ctx.save();
    ctx.rotate(this.offsetAngle);
    ctx.translate(...this.offset);

    ctx.rotate(this.angle);

    r.rect(ctx, {
      w: this.w,
      h: this.h,
      fill: COLORS.shield,
      stroke: "black",
      strokeWidth: 5,
    });
    r.rect(ctx, {
      w: this.w,
      h: this.h,
      stroke: "grey",
      strokeWidth: 4,
    });

    ctx.restore();
  }
}
