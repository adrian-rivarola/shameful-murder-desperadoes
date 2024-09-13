import { KEYBOARD, MOUSE, MOUSE_POS } from "./config";
import { norm } from "./math";

export class PlayerController implements Controller {
  constructor(protected keys: string | string[]) {}

  get equip1(): boolean {
    return KEYBOARD["1"];
  }
  get equip2(): boolean {
    return KEYBOARD["2"];
  }
  get equip3(): boolean {
    return KEYBOARD["3"];
  }

  get action1(): boolean {
    return !!MOUSE[0];
  }

  get action2(): boolean {
    return !!MOUSE[2];
  }

  get actionPos(): Vector {
    return MOUSE_POS;
  }

  get up() {
    return KEYBOARD[this.keys[0]];
  }
  get down() {
    return KEYBOARD[this.keys[1]];
  }
  get left() {
    return KEYBOARD[this.keys[2]];
  }
  get right() {
    return KEYBOARD[this.keys[3]];
  }
  get roll() {
    return KEYBOARD[this.keys[4]];
  }

  get direction() {
    const dir: Vector = [0, 0];

    if (this.up) {
      dir[1] -= 1;
    }
    if (this.down) {
      dir[1] += 1;
    }
    if (!this.up && !this.down) {
      dir[1] = 0;
    }

    if (this.left) {
      dir[0] -= 1;
    }
    if (this.right) {
      dir[0] += 1;
    }
    if (!this.left && !this.right) {
      dir[0] = 0;
    }

    return norm(dir);
  }

  get json(): any {
    const keys: Array<keyof PlayerController> = [
      "up",
      "down",
      "left",
      "right",
      "roll",
      "action1",
      "action2",
      "equip1",
      "equip2",
      "equip3",
    ];

    if (this.action1 || this.action2) {
      keys.push("actionPos");
    }

    return keys.reduce(
      (obj, val) => ({ ...obj, [val]: this[val] || undefined }),
      {}
    );
  }
}
