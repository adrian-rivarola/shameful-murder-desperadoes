import { SCREEN_OPTS } from "./config";
import * as m from "./math";

export function scaleToTileSize(v: Vector): Vector {
  return m.scale(v, SCREEN_OPTS.tileSize);
}

export function choose<T>(l: Array<T>) {
  return l[Math.floor(Math.random() * l.length)];
}

export function getRandomColor() {
  const colors = ["orange", "yellow", "salmon", "lightblue"];
  return choose(colors);
}

export function getRandomPos() {
  const [mapW, mapH] = SCREEN_OPTS.mapSize;
  const x = 2 + Math.floor(Math.random() * (mapW - 2));
  const y = 2 + Math.floor(Math.random() * 6);

  return scaleToTileSize([x, y]) as Vector;
}
