import Character from "./character";
import { EntityType } from "./entity";
import { PLAYER_UPGRADES } from "./upgrades";

export default class Player extends Character {
  maxHp = PLAYER_UPGRADES.maxHp[0];
  maxStamina = PLAYER_UPGRADES.maxStamina[0];

  get type(): EntityType {
    return EntityType.player;
  }
}
