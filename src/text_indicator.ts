import Entity from "./entity";
import * as m from "./math";
import Scene from "./scene";

export default class TextIndicator extends Entity {
  maxAge = 1;
  solid = false;

  text: string;
  fillColor?: string;
  strokeColor?: string;

  constructor(
    scene: Scene,
    pos: Vector,
    { text = "", fillColor = "", strokeColor = "" } = {}
  ) {
    super(scene);

    this.pos = pos;
    this.text = text;
    this.moveDir = [0, -1];
    this.baseSpeed = 20;
    this.fillColor = fillColor;
    this.strokeColor = strokeColor;
  }

  static upgradeOpts(text: string) {
    return {
      text,
      fillColor: "lightgreen",
      strokeColor: "lightgreen",
    };
  }

  static damageOpts(val: number) {
    return {
      text: val.toString(),
      fillColor: "red",
      strokeColor: "black",
    };
  }

  static dodgedOpts() {
    return {
      text: "dodged",
      fillColor: "white",
    };
  }

  update(dt: number): void {
    super.update(dt);

    this.move(dt);

    if (this.age >= this.maxAge) {
      this.remove();
    }
  }

  render(ctx: Ctx) {
    ctx.save();

    ctx.font = "20px Arial";
    ctx.globalAlpha = m.lerp(0, 1, 1 - this.age / this.maxAge);

    if (this.fillColor) {
      ctx.fillStyle = this.fillColor;
      ctx.fillText(this.text, ...this.pos);
    }

    if (this.strokeColor) {
      ctx.strokeStyle = this.strokeColor;
      ctx.strokeText(this.text, ...this.pos);
    }

    ctx.restore();
  }
}
