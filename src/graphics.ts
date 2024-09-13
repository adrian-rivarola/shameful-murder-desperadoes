type CanvasColor = string | CanvasGradient | CanvasPattern;
interface RectOpts {
  w: number;
  h: number;
  fill?: CanvasColor;
  stroke?: CanvasColor;
  strokeWidth?: number;
  center?: boolean;
  offset?: Vector;
  opacity?: number;
}

export function rect(ctx: Ctx, rect: RectOpts) {
  const {
    w,
    h,
    fill,
    strokeWidth,
    stroke,
    center = true,
    opacity,
    offset,
  } = rect;

  ctx.save();

  if (center) {
    ctx.translate(-w / 2, -h / 2);
  }

  if (offset) {
    ctx.translate(...offset);
  }

  if (opacity != undefined) {
    ctx.globalAlpha = opacity;
  }

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
  }

  if (strokeWidth || stroke) {
    ctx.strokeStyle = stroke || ctx.strokeStyle;
    ctx.lineWidth = strokeWidth || 1;
    ctx.strokeRect(0, 0, w, h);
  }

  ctx.restore();
}

export function progressBar(
  ctx: Ctx,
  w: number,
  h: number,
  progress: number,
  color: string
) {
  ctx.save();

  rect(ctx, {
    w,
    h,
    fill: "white",
    stroke: "black",
    strokeWidth: 0.5,
  });
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, progress * w, h);

  ctx.restore();
}

export function circle(
  ctx: Ctx,
  r: number,
  fill?: CanvasColor,
  stroke?: CanvasColor
) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke!;
    ctx.stroke();
  }

  ctx.closePath();

  ctx.restore();
}
