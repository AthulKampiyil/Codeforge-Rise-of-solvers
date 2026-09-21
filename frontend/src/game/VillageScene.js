import Phaser from "phaser";

const BAND = (level) => level >= 10 ? 4 : level >= 6 ? 3 : level >= 3 ? 2 : level >= 1 ? 1 : 0;
const COLORS = [0x536273, 0x4e9b78, 0x4b83b8, 0xb77b45, 0xa85d69];

function drawStructure(graphics, structureKey, band, color) {
  graphics.fillStyle(color, 1);
  const width = 22 + band * 7;
  const height = 24 + band * 8;
  graphics.fillRect(-width, -height / 2, width * 2, height);
  if (structureKey === "tower" || structureKey === "observatory" || structureKey === "fortress") {
    graphics.fillTriangle(-width - 7, -height / 2, width + 7, -height / 2, 0, -height - 30);
  } else if (structureKey === "grove") {
    graphics.fillCircle(-18, -height / 2 - 8, 18 + band * 2);
    graphics.fillCircle(18, -height / 2 - 10, 20 + band * 2);
  } else {
    graphics.fillTriangle(-width - 5, -height / 2, width + 5, -height / 2, 0, -height - 20);
  }
}

export default class VillageScene extends Phaser.Scene {
  constructor() { super("VillageScene"); this.topicSprites = new Map(); }

  create() {
    this.add.text(28, 24, "PERSONAL CODE VILLAGE", { fontFamily: "monospace", fontSize: "14px", color: "#d5a95f" });
    this.add.text(28, 47, "Click a structure to inspect its influence", { fontFamily: "sans-serif", fontSize: "12px", color: "#91a0b3" });
    this.renderVillage(this.data?.village || this.village || { topics: [] });
    this.stateListener = (event) => this.updateVillage(event.detail);
    window.addEventListener("codeforge:village-state", this.stateListener);
    this.events.once("shutdown", () => window.removeEventListener("codeforge:village-state", this.stateListener));
  }

  init(data) { this.village = data?.village; }

  renderVillage(village) {
    this.topicSprites.forEach((item) => item.destroy());
    this.topicSprites.clear();
    this.topicPanel?.destroy();
    this.topicPanel = null;
    (village.topics || []).forEach((topic, index) => {
      const column = index % 4; const row = Math.floor(index / 4);
      const x = this.scale.width / 2 + (column - 1.5) * 150 + row * 35;
      const y = 180 + row * 145 - column * 12;
      const group = this.add.container(x, y).setSize(110, 105).setInteractive();
      const color = COLORS[BAND(topic.level)];
      const base = this.add.graphics(); base.fillStyle(0x192532, 0.9).fillEllipse(0, 28, 122, 34);
      const building = this.add.graphics();
      drawStructure(building, topic.structure_key, BAND(topic.level), color);
      const label = this.add.text(0, 48, `${topic.display_name || topic.name}\nLV ${topic.level}`, { fontFamily: "monospace", fontSize: "11px", color: "#edf2f7", align: "center" }).setOrigin(.5, 0);
      group.add([base, building, label]);
      group.on("pointerdown", () => this.openTopic(topic));
      this.topicSprites.set(topic.id || topic.name, group);
    });
  }

  updateVillage(village) { this.village = village; this.renderVillage(village); }

  openTopic(topic) {
    this.topicPanel?.destroy();
    this.topicPanel = this.add.container(this.scale.width - 175, 100);
    const background = this.add.rectangle(0, 0, 290, 118, 0x171c26, .96).setOrigin(0, 0);
    const title = this.add.text(20, 20, topic.display_name || topic.name, { fontFamily: "sans-serif", fontSize: "18px", color: "#f0c777" });
    const details = this.add.text(20, 53, `Level ${topic.level}\n${topic.progress_points} progress points\n${topic.points_to_next_level ?? "?"} points to next level`, { fontFamily: "monospace", fontSize: "12px", color: "#c2cedb", lineSpacing: 7 });
    this.topicPanel.add([background, title, details]);
  }
}
