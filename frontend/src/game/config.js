// Shared Phaser game config (canvas size, physics off, scene registry).
// VillageScene (M3, Niranjan) and WarMapScene (M5, Athul) are still
// empty stub files as of the seed commit — imported here so both are
// registered the moment either lane adds a real `export default class
// ... extends Phaser.Scene`. Filtered so an unfinished stub (no export
// yet) doesn't crash Phaser.Game() in the meantime.
import Phaser from "phaser";

import VillageScene from "./scenes/VillageScene.js";
import WarMapScene from "./scenes/WarMapScene.js";

const REGISTERED_SCENES = [VillageScene, WarMapScene].filter((scene) => typeof scene === "function");

export function createGameConfig({ parent, width = 960, height = 640 } = {}) {
  return {
    type: Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: "#0d1117",
    physics: {},
    scene: REGISTERED_SCENES,
  };
}
