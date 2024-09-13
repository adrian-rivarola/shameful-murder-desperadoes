type Color = string | CanvasGradient | CanvasPattern;
type Ctx = CanvasRenderingContext2D;
type Vector = [number, number];

interface Controller {
  equip1: boolean;
  equip2: boolean;
  equip3: boolean;

  roll: boolean;

  action1: boolean;
  action2: boolean;
  actionPos: Vector;

  direction: Vector;
}

type Obstacle = {
  position: Vector;
  size: Vector;
};

type ScreenOptions = {
  mapSize: Vector;
  tileSize: number;
  scrSize: Vector;
  canvasSize: Vector;
};

// Head, Body, Arms, Legs
type CharacterSizeOpts = [Vector, Vector, Vector, Vector];
