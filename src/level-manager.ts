import * as audio from "./audio";
import { gameOverElement, KEYBOARD, SCREEN_OPTS } from "./config";
import { PlayerController } from "./controller";
import Enemy, { EnemyClass } from "./enemy";
import { EntityType } from "./entity";
import * as m from "./math";
import Player from "./player";
import Scene from "./scene";
import { Idle } from "./state";
import TextIndicator from "./text_indicator";
import { getRandomColor, getRandomPos, scaleToTileSize } from "./utils";
import { Bow, Shield, Sword, Weapon } from "./weapon";

const maxLevel = 12 + 1;

const hotbarWeapons: Weapon[] = [new Sword(), new Bow(), new Shield()];

export default class LevelManager {
  currLevel = 1;
  scene: Scene;
  player!: Player;

  state: LevelState = new LevelState();
  started = false;

  currentBoss?: Enemy;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  get initialPlayerPos(): Vector {
    const [mapW, mapH] = SCREEN_OPTS.mapSize;
    return scaleToTileSize([mapW * 0.5, mapH - 2]) as Vector;
  }

  get initialBossPos(): Vector {
    const [mapW, mapH] = SCREEN_OPTS.mapSize;
    return scaleToTileSize([mapW * 0.5, 3]) as Vector;
  }

  get enemyCount() {
    switch (true) {
      case this.currLevel < 4:
        return 2;
      case this.currLevel < 10:
        return 3;
      case this.currLevel < 12:
        return 4;
      default:
        return 5;
    }
  }

  get isFinalRound() {
    return this.currLevel === 12 + 1;
  }

  changeState(newState: LevelState) {
    this.state.exit(this);

    newState.enter(this);
    this.state = newState;
  }

  createPlayer() {
    const ctrl = new PlayerController("wsad ");
    this.player = new Player(this.initialPlayerPos, ctrl, this.scene);
    this.player.stamina = this.player.maxStamina;
  }

  createBoss(cls?: EnemyClass) {
    const level = Math.floor(this.currLevel / 4);
    const e = new Enemy(
      this.initialBossPos,
      this.scene,
      "black",
      cls ??
        (this.isFinalRound || Math.random() > 0.75
          ? EnemyClass.MELEE
          : EnemyClass.ARCHER),
      this.currLevel + 1
    );
    e.defenseFactor = Math.floor(level * 0.5);
    e.sizeRatios = e.sizeRatios.map((s) =>
      m.scale(s, 1 + level * 0.5)
    ) as CharacterSizeOpts;
    e.resize(1);

    e.rollSkill = level > 1;
    e.maxHp *= 1.125;
    e.hp = e.maxHp;
    if (e.enemyClass === EnemyClass.ARCHER) {
      e.weapon.coolDown *= 0.5;
      (e.weapon as Bow).projectileSpeed *= 1.5;
    } else {
      e.speedFactor += 0.25;
    }
    e.target = this.player;

    return e;
  }

  createEnemies() {
    const positions = new Set<Vector>();
    const maxEnemies = this.enemyCount;

    while (positions.size < maxEnemies) {
      const pos = getRandomPos();
      if (!positions.has(pos)) {
        positions.add(pos);
        const enemyLevel = Math.ceil(
          this.currLevel * 0.5 + Math.random() * this.currLevel * 0.25
        );
        const e = new Enemy(
          pos,
          this.scene,
          getRandomColor(),
          Math.random() > 0.75 ? EnemyClass.MELEE : EnemyClass.ARCHER,
          enemyLevel
        );
        e.hp = e.maxHp = Math.floor(e.maxHp * 0.75);
        e.weapon.damage = Math.floor(e.weapon.damage * 0.75);
        if (enemyLevel >= 5) {
          e.rollSkill = Math.random() > 0.85;
          e.target = Math.random() >= 0.85 ? this.player : undefined;
        }
      }
    }
  }

  respawnPlayer() {
    this.scene.entities.clear();
    this.scene.resetCount();
    this.scene.entities.add(this.player);
    this.player.hp = this.player.maxHp;
    this.player.pos = this.initialPlayerPos;
    this.player.changeState(new Idle());
  }

  restart(isGamePlus: boolean = false) {
    console.log("restart()");

    this.currLevel = 0;
    this.currentBoss = undefined;
    this.scene.entities.clear();
    this.scene.resetCount();
    isGamePlus ? this.respawnPlayer() : this.createPlayer();
    this.createEnemies();
    this.changeState(new PlayingState());
    this.started = true;
  }

  advanceLevel() {
    if (this.isFinalRound) {
      this.changeState(new PlayerWonState());
      return;
    }

    this.currLevel = Math.min(this.currLevel + 1, maxLevel);
    this.currentBoss = undefined;

    this.createEnemies();

    let upgradeText = "";
    if (this.currLevel % 4 === 0) {
      this.player.upgrade();
      upgradeText = "Level Up";
    } else {
      const idx = (this.currLevel - 1) % this.player.items.length;
      this.player.items[idx].upgrade();
      const items = ["Sword", "Bow", "Shield"];
      upgradeText = `${items[idx]} upgraded`;
    }

    audio.upgrade();
    new TextIndicator(
      this.scene,
      this.player.pos,
      TextIndicator.upgradeOpts(upgradeText)
    );

    this.changeState(new PlayingState());
  }

  update(dt: number) {
    this.state.update(this, dt);
  }

  render(ctx: Ctx) {
    if (!this.started) {
      return;
    }

    ctx.save();

    this.drawHotbar(ctx);

    if (this.scene.debug) {
      this.drawDebugInfo(ctx);

      this.scene.entities.forEach((e) => {
        e.drawCollisionBox(ctx);
      });
      ctx.restore();
    }
  }

  drawHotbar(ctx: CanvasRenderingContext2D) {
    const player = this.player;
    const hotbarItemSize = SCREEN_OPTS.tileSize;
    const hotbarItems = [
      {
        func: (ctx: Ctx) => {
          ctx.save();
          // Move to corner
          ctx.translate(-hotbarItemSize * 0.5, hotbarItemSize * 0.5);
          ctx.rotate(m.HALF_PI * 0.5);
          hotbarWeapons[0].render(ctx);
          ctx.restore();
        },
        selected: player.currItem == 0,
      },
      {
        func: (ctx: Ctx) => {
          ctx.save();
          ctx.translate(-hotbarItemSize * 0.125, -hotbarItemSize * 0.125);
          ctx.rotate(m.HALF_PI * 0.5);
          hotbarWeapons[1].render(ctx);
          ctx.restore();
        },
        selected: player.currItem == 1,
      },
      {
        func: (ctx: Ctx) => {
          ctx.save();
          // Move to corner
          // ctx.rotate(0.68);
          ctx.rotate(m.HALF_PI * 0.5);
          ctx.scale(-0.8, 0.8);
          hotbarWeapons[2].render(ctx);
          ctx.restore();
        },
        selected: player.currItem == 2,
      },
    ];

    ctx.save();
    ctx.translate(
      hotbarItemSize,
      SCREEN_OPTS.canvasSize[1] - hotbarItemSize * 2
    );

    hotbarItems.forEach((item, idx) => {
      ctx.save();
      ctx.translate((hotbarItemSize + 5) * idx, 0);

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, hotbarItemSize, hotbarItemSize);
      ctx.globalAlpha = 1;

      if (item.selected) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = "green";
        ctx.strokeRect(0, 0, hotbarItemSize, hotbarItemSize);
      }

      ctx.fillStyle = "black";
      ctx.fillText(`${idx + 1}`, 5, 12);

      ctx.save();
      ctx.translate(hotbarItemSize * 0.5, hotbarItemSize * 0.5);
      ctx.scale(0.8, 0.8);

      item.func(ctx);

      ctx.restore();
      ctx.restore();
    });

    ctx.restore();
  }

  drawDebugInfo(ctx: Ctx) {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.font = "14px Roboto";

    const texts = [
      `Map: ${SCREEN_OPTS.mapSize.join("x")}`,
      `Res: ${SCREEN_OPTS.scrSize.join("x")}`,
      `Canvas: ${SCREEN_OPTS.canvasSize.join("x")}`,
      `Tile: ${SCREEN_OPTS.tileSize}`,
      `Entities: ${this.scene.entities.size}`,
      `Level: ${this.currLevel}`,
    ];
    texts.forEach((text, i) => {
      ctx.fillText(text, 10, 50 + 16 * (i + 1));
    });
    ctx.restore();
  }
}

class LevelState {
  age = 0;

  enter(level: LevelManager) {}
  exit(level: LevelManager) {}

  update(level: LevelManager, dt: number) {
    this.age += dt;
  }
}

class PlayingState extends LevelState {
  exitDelay = 1.1;
  playerDead = 0;
  miniBossDefeated = false;
  hasMiniBoss = false;

  enter(level: LevelManager): void {
    this.hasMiniBoss =
      (level.currLevel > 0 && level.currLevel % 4 === 0) || level.isFinalRound;
    console.log(level);
    console.log({ enter: this.hasMiniBoss });
  }

  update(level: LevelManager, dt: number): void {
    super.update(level, dt);

    if (this.playerDead) {
      if (this.age - this.playerDead > this.exitDelay) {
        level.changeState(new PlayerDeadState());
      }
      return;
    }

    if (!level.player.alive) {
      this.playerDead = this.age;
      return;
    }

    this.miniBossDefeated =
      level.currentBoss !== undefined && !level.currentBoss!.alive;

    if (level.scene.count[EntityType.enemy] === 0) {
      if (this.hasMiniBoss && !this.miniBossDefeated) {
        level.currentBoss = level.createBoss();
      } else {
        level.advanceLevel();
      }
    }
  }
}

const [deadMsg, winMsg, restartBtn, newGamePlusBtn] = gameOverElement.children;

class PlayerDeadState extends LevelState {
  enter(level: LevelManager): void {
    level.started = false;
    level.scene.paused = true;

    deadMsg.classList.remove("hide");
    restartBtn.classList.remove("hide");

    winMsg.classList.add("hide");
    newGamePlusBtn.classList.add("hide");

    gameOverElement.classList.remove("hide");
  }

  exit(level: LevelManager): void {
    const [deadMsg, winMsg, restartBtn, newGamePlusBtn] =
      gameOverElement.children;

    gameOverElement.classList.add("hide");

    deadMsg.classList.add("hide");
    restartBtn.classList.add("hide");

    level.scene.paused = false;
  }
}

class PlayerWonState extends LevelState {
  enter(level: LevelManager): void {
    level.started = false;
    level.scene.paused = true;

    const [deadMsg, winMsg, restartBtn, newGamePlusBtn] =
      gameOverElement.children;

    deadMsg.classList.add("hide");

    restartBtn.classList.remove("hide");
    winMsg.classList.remove("hide");
    newGamePlusBtn.classList.remove("hide");

    gameOverElement.classList.remove("hide");
  }

  exit(level: LevelManager): void {
    gameOverElement.classList.add("hide");

    winMsg.classList.add("hide");
    newGamePlusBtn.classList.add("hide");

    level.scene.paused = false;
  }
}
