import Character from "./character";
import { SCREEN_OPTS } from "./config";
import { COLORS } from "./constants";
import Entity, { EntityType } from "./entity";
import * as r from "./graphics";
import HitBox from "./hitbox";
import * as m from "./math";
import TextIndicator from "./text_indicator";
import { scaleToTileSize } from "./utils";
import { Sword } from "./weapon";

const projectileSize: Vector = [0.8, 0.06];

export default class Projectile extends Entity {
  owner: Character;
  ogOwner: Character;
  hitbox?: HitBox;
  damage: number;
  ignoredEntites: Set<Entity> = new Set();

  opacity = 1;
  attachedAt = 0;
  maxAttachmentAge = 2;
  attachedTo?: Entity;
  attachOffset?: Vector;

  _size: Vector;

  constructor(owner: Character, dir: Vector, speed: number, damage: number) {
    super(owner.scene);

    this.pos = owner.pos;
    this.moveDir = dir;
    this.ogOwner = this.owner = owner;
    this.baseSpeed = speed * SCREEN_OPTS.tileSize;
    this._size = scaleToTileSize(projectileSize);
    this.damage = damage;
    this.angle = m.angle(dir);
    this.hitbox = new HitBox(
      this,
      [this.w, this.h],
      this.pos,
      this.onCollision.bind(this)
    );
    this.ignoredEntites.add(this.owner);
    this.ignoredEntites.add(this);
  }

  resize(ratio: number): void {
    this._size = scaleToTileSize(projectileSize);
  }

  get type(): EntityType {
    return EntityType.projectile;
  }

  get size(): Vector {
    return this._size;
  }

  get w() {
    return this.size[1];
  }
  get h() {
    return this.size[1];
  }

  deflect(newDir: Vector) {
    this.damage *= 2;

    // this.angle = m.HALF_PI;
    this.moveDir = newDir;
    this.angle = m.angle(this.moveDir);
  }

  onCollision(obj: Entity) {
    if (this.ignoredEntites.has(obj)) {
      return true;
    }
    this.ignoredEntites.add(obj);

    if (obj instanceof Projectile) {
      // Avoid being deflected by a projectile attached to player
      if (obj.attachedTo) {
        return true;
      }

      new TextIndicator(this.scene, this.pos, {
        text: "Deflected",
        fillColor: "white",
        strokeColor: "black",
      });

      obj.ignoredEntites.add(this);
      // TODO: Deflect projectiles to correct angles
      obj.deflect([0, -1]);
      this.deflect([0, 1]);
      return false;
    }

    if (obj instanceof HitBox) {
      new TextIndicator(this.scene, this.pos, {
        text: "Deflected",
        fillColor: "white",
        strokeColor: "black",
      });
      this.ignoredEntites.delete(this.owner);
      this.owner = obj.owner as Character;
      // TODO: Deflect projectile to correct angle
      this.deflect([0, 1]);
      return true;
    }

    if (obj instanceof Character) {
      if (obj.rolling) {
        new TextIndicator(this.scene, this.pos, TextIndicator.dodgedOpts());
        return true;
      }
      if (obj === this.ogOwner) {
        console.log("Return to sender achievement");
      }
      obj.takeDamage(this.damage, this.owner);
    }

    this.attachedTo = obj;
    this.attachedAt = this.age;
    this.attachOffset = m.sub(this.pos, obj.pos);

    this.hitbox?.remove();
    delete this.hitbox;

    return false;
  }

  update(dt: number) {
    super.update(dt);

    if (this.attachedTo) {
      if (
        !this.attachedTo.alive ||
        this.age - this.attachedAt > this.maxAttachmentAge
      ) {
        this.remove();
        return;
      }

      this.pos = m.add(this.attachedTo.pos, this.attachOffset!);
      return;
    }

    if (this.hitbox) {
      this.move(dt);

      if (this.isOutOfMap) {
        this.hitbox?.remove();
        this.remove();
      } else {
        this.hitbox.pos = this.pos;
        this.hitbox.update(dt);
      }

      return;
    }

    this.opacity -= dt * 4;
    if (this.opacity <= 0) {
      this.remove();
    }
  }

  render(ctx: Ctx) {
    ctx.save();

    ctx.translate(...this.pos);
    ctx.rotate(this.angle);

    r.rect(ctx, {
      w: 40,
      h: 3,
      opacity: this.opacity,
      stroke: "black",
      strokeWidth: 0.25,
      fill: COLORS.projectile,
    });

    ctx.restore();
  }
}
