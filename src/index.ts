import { ctx, KEYBOARD, SCREEN_OPTS, setup } from "./config";
import { COLORS } from "./constants";
import { PlayerController } from "./controller";
import Enemy, { EnemyClass } from "./enemy";
import * as r from "./graphics";
import * as m from "./math";
import Player from "./player";
import Scene from "./scene";
import { Bow, Shield, Sword, Weapon } from "./weapon";

export const scene = new Scene();

setup();

function drawBackground(ctx: Ctx) {
  const [w, h] = SCREEN_OPTS.canvasSize;
  r.rect(ctx, {
    w,
    h,
    fill: COLORS.backgorund,
    center: false,
  });

  const cellSize = SCREEN_OPTS.tileSize;

  ctx.save();
  ctx.fillStyle = COLORS.backgorund;

  // Vertical lines
  for (let i = 1; i <= SCREEN_OPTS.mapSize[0]; i += 1) {
    // ctx.globalAlpha = 1;
    // ctx.strokeText(i.toString(), 0, 10);

    ctx.globalAlpha = 0.125;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, h);
    ctx.stroke();
    ctx.translate(cellSize, 0);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = COLORS.backgorund;

  // Horizontal lines
  for (let i = 1; i <= SCREEN_OPTS.mapSize[1]; i += 1) {
    // ctx.globalAlpha = 1;
    // ctx.strokeText(i.toString(), 0, 10);

    ctx.globalAlpha = 0.125;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.translate(0, cellSize);
  }
  ctx.restore();
}

const hotbarWeapons: Weapon[] = [new Sword(), new Bow(), new Shield()];

function drawHotbar(ctx: CanvasRenderingContext2D) {
  const player = scene.manager.player;
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
  ctx.translate(hotbarItemSize, SCREEN_OPTS.canvasSize[1] - hotbarItemSize * 2);

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

let debug = false;
let lastframe = performance.now();

const frame = () => {
  const now = performance.now();
  const dt = (now - lastframe) / 1000;
  lastframe = now;

  drawBackground(ctx);

  scene.update(dt);
  scene.render(ctx);

  requestAnimationFrame(frame);
};

frame();
