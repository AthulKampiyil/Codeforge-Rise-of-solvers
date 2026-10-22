// Shared Phaser game config (canvas size, physics off, scene registry).
// VillageScene (M3, Niranjan) and WarMapScene (M5, Athul) are both real
// scenes now, registered here so either can be launched by key.
import Phaser from "phaser";

import VillageScene from "./VillageScene.js";
import WarMapScene from "./WarMapScene.js";

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
