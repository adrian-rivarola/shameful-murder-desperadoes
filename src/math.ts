export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

// New stuff
export const HALF_PI = Math.PI / 2;
export const TWO_PI = Math.PI * 2;

export function len(v: Vector): number {
  return Math.hypot(...v);
}
export function norm(v: Vector): Vector {
  const l = len(v) || 1;
  return v.map((e) => e / l) as Vector;
}

export function scale(v: Vector, s: number): Vector {
  return v.map((e) => e * s) as Vector;
}

export function add(v1: Vector, v2: Vector): Vector {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

export function sub(v1: Vector, v2: Vector): Vector {
  return [v1[0] - v2[0], v1[1] - v2[1]];
}

export function angle(v: Vector): number {
  return Math.atan2(v[1], v[0]);
}

export function fromAngle(a: number): Vector {
  return [Math.cos(a), Math.sin(a)] as Vector;
}

export function rotateVector(v: Vector, angle: number): Vector {
  const [x, y] = v;
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);

  return [x * cosTheta - y * sinTheta, x * sinTheta + y * cosTheta];
}

export function lerp(minVal: number, maxVal: number, t: number) {
  return minVal + (maxVal - minVal) * t;
}

export function lerpMinMaxMin(
  minVal: number,
  maxVal: number,
  t: number
): number {
  if (t <= 0.5) {
    return minVal + (maxVal - minVal) * (t * 2);
  } else {
    return maxVal - (maxVal - minVal) * ((t - 0.5) * 2);
  }
}
