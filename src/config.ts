import { scene } from "./index";
import * as m from "./math";
import { scaleToTileSize } from "./utils";

export let canvas: HTMLCanvasElement;
export let ctx: Ctx;

const pauseOverlay = document.getElementById("pause-overlay")!;
export const gameOverElement = document.getElementById("game-over")!;
export const startGameBtn = document.getElementById("start-game")!;

export let KEYBOARD: Record<string, boolean> = {};
export const MOUSE: Record<number, boolean> = {};
export const MOUSE_POS: Vector = [0, 0];

export const SCREEN_OPTS = {
  mapSize: [32, 18] as Vector, // 16:9
  mapRatio: 32 / 18,
  tileSize: 32,
  scrSize: [window.innerWidth, window.innerHeight] as Vector,
  canvasSize: [32, 18].map((e) => e * 32) as Vector,
};

export const WEAPON_OPTS = {
  sword: [0.17, 1.25] as Vector,
  swordSize: [0.25, 2] as Vector,

  bow: [0.13, 0.88] as Vector,
  bowdSize: [6, 40] as Vector,

  shield: [0.6, 1.3] as Vector,
  shieldSize: [30, 60] as Vector,
};

export const DEFAULT_CHARACTER_SIZE: CharacterSizeOpts = [
  [0.4, 0.4],
  [0.6, 0.8],
  [0.17, 0.57],
  [0.22, 0.44],
];

export function setup() {
  canvas = document.getElementById("game") as HTMLCanvasElement;
  ctx = canvas.getContext("2d")!;

  _addListeners();
  _resizeCanvas();

  startGameBtn.onclick = () => {
    startGameBtn.parentElement?.classList.add("hide");
    scene.manager.restart();
  };

  const restartBtn = gameOverElement.children[2] as HTMLButtonElement;
  const gamePlusBtn = gameOverElement.children[3] as HTMLButtonElement;

  restartBtn.onclick = () => {
    scene.manager.restart();
  };
  gamePlusBtn.onclick = () => {
    scene.manager.restart(true);
  };
}

const _resizeCanvas = () => {
  const [sw, sh] = [window.innerWidth, window.innerHeight];
  SCREEN_OPTS.scrSize = [sw, sh];

  const [mw, mh] = SCREEN_OPTS.mapSize;

  const prevTileSize = SCREEN_OPTS.tileSize;
  SCREEN_OPTS.tileSize = Math.min(Math.floor(sw / mw), Math.floor(sh / mh));

  SCREEN_OPTS.canvasSize = [canvas.width, canvas.height] = scaleToTileSize(
    SCREEN_OPTS.mapSize
  );

  WEAPON_OPTS.swordSize = scaleToTileSize(WEAPON_OPTS.sword);
  WEAPON_OPTS.bowdSize = scaleToTileSize(WEAPON_OPTS.bow);
  WEAPON_OPTS.shieldSize = scaleToTileSize(WEAPON_OPTS.shield);

  const ratio = SCREEN_OPTS.tileSize / prevTileSize;
  if (ratio !== 0) {
    scene.resize(ratio);
  }
};

function _addListeners() {
  canvas.addEventListener("mousemove", (ev) => {
    MOUSE_POS[0] = ev.offsetX;
    MOUSE_POS[1] = ev.offsetY;
  });
  onresize = () => _resizeCanvas();

  onmousedown = (ev) => {
    MOUSE[ev.button] = true;
  };
  onmouseup = (ev) => {
    MOUSE[ev.button] = false;
  };
  oncontextmenu = (ev) => ev.preventDefault();

  onkeydown = (ev) => {
    const key = ev.key.toLowerCase();
    if (key === "p") {
      scene.paused = !scene.paused;
      pauseOverlay.classList.toggle("hide");
    }

    // if (key === "]") {
    //   scene.debug = !scene.debug;
    // }
    KEYBOARD[key] = true;
  };
  onkeyup = (ev) => (KEYBOARD[ev.key.toLowerCase()] = false);

  onblur = onfocus = () => {
    KEYBOARD = {};
  };
}
