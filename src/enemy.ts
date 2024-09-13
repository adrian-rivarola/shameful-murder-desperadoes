import Character from "./character";
import { EntityType } from "./entity";
import * as m from "./math";
import Scene from "./scene";
import { choose } from "./utils";
import { Bow, Sword } from "./weapon";

export enum EnemyClass {
  MELEE,
  ARCHER,
  MIXED,
}

const enemyController: Controller = {
  equip1: false,
  equip2: false,
  equip3: false,
  roll: false,
  action1: false,
  action2: false,
  actionPos: [0, 0],
  direction: [0, 0],
};

export default class Enemy extends Character {
  enemyClass = EnemyClass.MELEE;

  target?: Character;
  aggresive = false;
  rollSkill = false;

  maxWeaponReach = 0;
  weaponCooldownFactor = 5;

  hpRegenStep = 0.5;

  constructor(
    pos: Vector,
    scene: Scene,
    color: string,
    enemeyClass: EnemyClass,
    level: number
  ) {
    super(pos, { ...enemyController }, scene, color);

    this.enemyClass = enemeyClass;
    switch (enemeyClass) {
      case EnemyClass.MELEE:
      case EnemyClass.MIXED:
        this.items = [new Sword()];
        break;

      case EnemyClass.ARCHER:
        this.items = [new Bow()];
        break;

      // TODO: Enemies with multiple weapons
      // case EnemyClass.MIXED:
      //   this.items = [new Sword(), new Bow()];
      //   break;
    }

    while (level) {
      if (Math.random() > 0.25) {
        this.upgrade();
      } else {
        this.items[0].upgrade();
      }
      level--;
    }

    this.items.forEach((weapon) => {
      weapon.coolDown *= this.weaponCooldownFactor;
      if (weapon.reach >= this.maxWeaponReach) {
        this.maxWeaponReach = weapon.reach;
      }
    });
    // TODO: ???
    this.maxWeaponReach *= 1.5;
  }

  get type(): EntityType {
    return EntityType.enemy;
  }

  takeDamage(damage: number, attacker: Character): void {
    super.takeDamage(damage, attacker);
    if (attacker.type === EntityType.player || Math.random() > 0.9) {
      this.target = attacker;
    }
  }

  updateController() {
    this.ctrl = { ...enemyController };

    if (!this.target) {
      // TODO: Find other enemy to merge?
      return;
    }

    if (!this.target.alive) {
      this.target = undefined;
      this.aggresive = false;
      return;
    }

    const [dist, dirToPlayer] = this.getDistanceToTarget()!;

    if (dist >= this.maxWeaponReach) {
      this.ctrl.direction = m.norm(dirToPlayer);
      this.ctrl.roll =
        this.rollSkill &&
        this.stamina >= this.maxStamina * 0.5 &&
        this.enemyClass === EnemyClass.MELEE &&
        Math.random() >= 0.975;
    } else if (
      this.target.ctrl.action1 &&
      this.rollSkill &&
      Math.random() >= 0.75
    ) {
      this.ctrl.direction = [choose([-1, 1]), choose([-1, 1])];
      this.ctrl.roll = true;
    } else if (this.canUseWeapon) {
      this.ctrl.actionPos = this.target.pos;
      this.ctrl.action1 = true;
    }
  }

  update(dt: number): void {
    this.updateController();
    super.update(dt);
  }

  getDistanceToTarget(): [number, Vector] | undefined {
    if (!this.target) {
      return;
    }

    const dirToPlayer = m.sub(this.target.pos, this.pos);
    const playerDist = m.len(dirToPlayer);
    return [playerDist, dirToPlayer];
  }

  // canAttack(playerDist: number): boolean {
  //   for (const weapon of this.items) {
  //     if (this.weapon.canUse(this) && playerDist <= (weapon.reach || 0) * 2) {
  //       this.currItem = this.items.indexOf(weapon);
  //       return true;
  //     }
  //   }

  //   return false;
  // }
}
