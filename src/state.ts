import * as audio from "./audio";
import Character, { BODY_IDX } from "./character";
import HitBox from "./hitbox";
import * as m from "./math";
import Projectile from "./projectile";
import TextIndicator from "./text_indicator";
import { Bow, Shield, Sword, Weapon } from "./weapon";

export abstract class CharacterState {
  age = 0;
  name = "CharacterState";

  enter(player: Character) {}
  exit(player: Character) {}

  update(player: Character, dt: number) {
    this.age += dt;
  }
}

export class Idle extends CharacterState {
  name = "Idle";

  checkItemChange(player: Character) {
    if (player.ctrl.equip1) {
      player.currItem = 0;
    } else if (player.ctrl.equip2) {
      player.currItem = 1;
    } else if (player.ctrl.equip3) {
      player.currItem = 2;
    }
  }

  // TODO: Improve this
  getActionForWeapon(weapon: Weapon) {
    if (weapon instanceof Sword) {
      return new Attacking();
    }
    if (weapon instanceof Bow) {
      return new Shooting();
    }
    if (weapon instanceof Shield) {
      return new Blocking();
    }
  }

  getNewState(player: Character): CharacterState | undefined {
    if (player.ctrl.action1 && player.canUseWeapon) {
      return this.getActionForWeapon(player.weapon);
    }

    if (player.ctrl.roll && player.canRoll) {
      return new Roll();
    }
  }

  update(player: Character, dt: number) {
    super.update(player, dt);

    this.checkItemChange(player);

    const newState = this.getNewState(player);
    newState && player.changeState(newState);
  }
}

export class Roll extends CharacterState {
  name = "Roll";
  direction!: Vector;

  get rollSpeed() {
    return m.TWO_PI * 2;
  }

  enter(player: Character) {
    audio.roll();

    player.speedFactor = 2;
    player.rolling = true;
    player.stamina -= player.rollStaminaCost;
    player.lastStaminaUse = player.age;
    this.direction = player.ctrl.direction;
  }

  exit(player: Character): void {
    player.angle = 0;
    player.rolling = false;
    player.speedFactor = 1;
    player.lastRoll = player.age;
  }

  update(player: Character, dt: number): void {
    super.update(player, dt);

    player.moveDir = this.direction!;
    player.angle += this.rollSpeed * dt * player.facingDir;

    // Stop rolling if player reached the max number of rolls
    const completedRoll = Math.abs(player.angle) >= m.TWO_PI;
    if (completedRoll) {
      player.changeState(new Idle());
    }
  }
}

// TODO: Improve Shield mechanic
export class Blocking extends CharacterState {
  name = "Blocking";
  minAge = 0.25;
  weaponOffset!: number;
  asd = true;

  enter(player: Character): void {
    // TODO: Add this property to Shield class
    player.speedFactor = (player.weapon as Shield).speedFactor;
    player.defenseFactor = (player.weapon as Shield).defenseFactor;
    player.lockFacingDir = player.weapon.active = true;
    this.weaponOffset = (player.weapon.w || 0) / 2;
  }

  exit(player: Character): void {
    player.speedFactor = 1;
    player.defenseFactor = 1;
    player.lockFacingDir = false;
    player.weapon.active = false;
    player.weapon.offset = [0, 0];
  }

  update(player: Character, dt: number): void {
    super.update(player, dt);

    player.lookAt(player.ctrl.actionPos);
    player.weapon.offset = [this.weaponOffset * player.facingDir, 0];

    if (this.asd && player.age - player.lastDamage < this.age) {
      console.log("Shield detected damage!");
      this.asd = false;
    }

    if (!player.ctrl.action1 && this.age >= this.minAge) {
      player.changeState(new Idle());
    }
  }
}

export class Attacking extends CharacterState {
  name = "Attacking";
  minAngle = 0;
  maxAngle!: number;

  swordHitbox!: HitBox;
  dodgedEntites: Set<Character> = new Set();

  enter(player: Character): void {
    if (!(player.weapon instanceof Sword)) {
      throw new Error("Invalid weapon!");
    }

    player.lockFacingDir = true;
    player.lookAt(player.ctrl.actionPos);

    const angleOffset = player.weapon.maxAngle * 0.5;
    const angle = m.angle(m.sub(player.ctrl.actionPos, player.pos)) + m.HALF_PI;

    player.weapon.offsetRange = [this.maxAngle, this.minAngle] = [
      angle + angleOffset * player.facingDir,
      angle + angleOffset * -player.facingDir,
    ];

    player.weapon.active = true;
    player.weapon.offsetAngle = this.minAngle;
    // TODO: Don't hardcode these?
    player.weapon.offset = [0, -player.characterSizes[BODY_IDX][1]];
    player.weapon.swingDir = player.facingDir;

    audio.swing();
    this.swordHitbox = new HitBox(
      player,
      [player.weapon.size[1], player.weapon.size[1]],
      m.add(player.pos, player.weapon.offset),
      (obj) => {
        if (obj instanceof Character && !this.dodgedEntites.has(obj)) {
          this.dodgedEntites.add(obj);
          if (obj.rolling) {
            new TextIndicator(
              player.scene,
              player.pos,
              TextIndicator.dodgedOpts()
            );
          } else {
            obj.takeDamage(player.weapon.damage, player);
          }
          return !!player.weapon.multiShot;
        }
        return true;
      }
    );
  }

  exit(player: Character): void {
    this.swordHitbox.remove();

    player.lockFacingDir = false;

    player.weapon.lastUse = player.age;
    player.weapon.active = false;
    player.weapon.offset = [0, 0];
    player.weapon.offsetAngle = 0;
  }

  update(player: Character, dt: number): void {
    super.update(player, dt);

    const attackProgress = this.age / (player.weapon as Sword).attackDuration;
    player.weapon.offsetAngle = m.lerp(
      this.minAngle,
      this.maxAngle,
      attackProgress
    );

    // TODO: Scale according to sword size
    const damagePos = m.rotateVector(
      m.sub(player.weapon.offset, [0, (player.weapon as Sword).size[1] * 0.5]),
      player.weapon.offsetAngle
    );
    this.swordHitbox.pos = m.add(player.pos, damagePos);

    if (attackProgress >= 1) {
      if (player.weapon.autoSwing && player.ctrl.action1) {
        audio.swing();
        this.dodgedEntites.clear();
        this.age = 0;
      } else {
        player.changeState(new Idle());
      }
    }
  }
}

export class Shooting extends CharacterState {
  name = "Shooting";

  enter(player: Character): void {
    player.weapon.active = true;
    player.weapon.offset = [0, -player.h * 0.5];

    const dir = m.sub(player.pos, player.ctrl.actionPos);
    player.weapon.offsetAngle = -m.HALF_PI + m.angle(dir);
    player.weapon.angle = m.TWO_PI / 4;

    player.speedFactor = 0.5;
    player.facingDir = 1;
    player.lockFacingDir = true;
  }

  exit(player: Character): void {
    // ?: Less cooldown if click is spammed?
    player.weapon.lastUse -= player.weapon.coolDown * 0.25;
    player.weapon.angle = player.weapon.offsetAngle = 0;
    player.weapon.active = false;
    player.weapon.offset = [0, 0];

    player.speedFactor = 1;
    player.lockFacingDir = false;
  }

  fire(player: Character) {
    audio.shoot();

    player.weapon.lastUse = player.age;
    new Projectile(
      player,
      m.norm(m.sub(player.ctrl.actionPos, player.pos)),
      (player.weapon as Bow).projectileSpeed,
      player.weapon.damage
    );
  }

  update(player: Character, dt: number): void {
    super.update(player, dt);

    const dir = m.sub(player.pos, player.ctrl.actionPos!);
    player.weapon.offsetAngle = -m.HALF_PI + m.angle(dir);

    if (player.canUseWeapon) {
      this.fire(player);
    }

    if (!player.ctrl.action1) {
      player.changeState(new Idle());
    }
  }
}

export class Dying extends CharacterState {
  duration = 1;

  enter(player: Character): void {
    player.speedFactor = 0;
    player.alive = player.solid = false;
    // TODO: Render effect
  }

  exit(player: Character): void {
    player.speedFactor = 1;
    player.solid = player.alive = true;
  }

  update(player: Character, dt: number): void {
    super.update(player, dt);

    player.opacity = m.lerp(0.5, 0, this.age / this.duration);

    if (this.age >= this.duration) {
      player.die();
    }
  }
}
