import * as m from "./math";
import { SCREEN_OPTS } from "./config";
import Entity, { EntityType } from "./entity";
import LevelManager from "./level-manager";

type GameEventType = "CHARACTER_DAMAGE" | "GAME_STARTED";

// ? Add camera movements/shake effect for attacks
export default class Scene {
  entities: Set<Entity> = new Set();

  eventTarget: EventTarget;
  manager: LevelManager;
  count: Record<EntityType, number> = {
    [EntityType.enemy]: 0,
    [EntityType.hitbox]: 0,
    [EntityType.player]: 0,
    [EntityType.projectile]: 0,
    [EntityType.entity]: 0,
  };

  paused = false;
  debug = false;

  constructor() {
    this.eventTarget = new EventTarget();
    this.manager = new LevelManager(this);
  }

  get mapW() {
    return SCREEN_OPTS.canvasSize[0];
  }

  get mapH() {
    return SCREEN_OPTS.canvasSize[1];
  }

  add(entity: Entity) {
    this.count[entity.type]++;
    this.entities.add(entity);
  }

  remove(entity: Entity) {
    this.count[entity.type]--;
    this.entities.delete(entity);
  }

  resetCount() {
    this.count = {
      [EntityType.enemy]: 0,
      [EntityType.hitbox]: 0,
      [EntityType.player]: 0,
      [EntityType.projectile]: 0,
      [EntityType.entity]: 0,
    };
  }

  resize(ratio: number) {
    this.entities.forEach((e) => {
      e.pos = m.scale(e.pos, ratio);
      e.resize(ratio);
    });
  }

  addEventListener(type: GameEventType, cb: any) {
    this.eventTarget.addEventListener(type, (ev) => {
      cb((ev as CustomEvent).detail);
    });
  }

  dispatchEvent(type: GameEventType, detail: any) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  update(dt: number) {
    if (this.paused) {
      return;
    }

    this.entities.forEach((c) => c.update(dt));
    this.manager.update(dt);
  }

  render(ctx: Ctx) {
    ctx.save();
    this.entities.forEach((c) => c.render(ctx));
    this.manager.render(ctx);
    ctx.restore();
  }
}
