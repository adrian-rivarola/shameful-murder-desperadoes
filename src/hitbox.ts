import Entity, { EntityType } from "./entity";

type CollissionFunc = (obj: Entity) => boolean;

// ? Create WeaponHitbox and ProjectileHitbox subclasses?
export default class HitBox extends Entity {
  owner: Entity;
  disabled = false;

  _size: Vector;

  onCollision: CollissionFunc;

  constructor(
    owner: Entity,
    size: Vector,
    pos: Vector,
    onCollision: CollissionFunc
  ) {
    super(owner.scene);

    this.pos = pos;
    this.owner = owner;
    this._size = size;
    this.onCollision = onCollision;
  }

  get type(): EntityType {
    return EntityType.hitbox;
  }

  get size() {
    return this._size;
  }

  update(dt: number): void {
    super.update(dt);

    if (this.disabled) {
      return;
    }

    const [x1, y1, w1, h1] = this.rect;

    for (const obj of this.scene.entities) {
      if (!obj.solid || obj === this.owner || obj === this) {
        continue;
      }

      const [x2, y2, w2, h2] = obj.rect;
      if (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2) {
        const keepChecking = this.onCollision(obj);

        if (!keepChecking) {
          this.disabled = true;
          return;
        }
      }
    }
  }
}
