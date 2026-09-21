import Phaser from "phaser";

const BAND = (level) => level >= 10 ? 4 : level >= 6 ? 3 : level >= 3 ? 2 : level >= 1 ? 1 : 0;
const COLORS = [0x536273, 0x4e9b78, 0x4b83b8, 0xb77b45, 0xa85d69];
const HOVER_COLORS = [0x6c7c91, 0x63bd93, 0x64a3d8, 0xd89a5c, 0xcb7c8b];

function drawStructure(graphics, structureKey, band, color) {
  graphics.clear();
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

// A structure's visual footprint runs roughly from y=-116 (tallest roof apex)
// down to y=+70 (bottom of the two-line label), centered on x=0. The old
// code called `setInteractive()` with no shape, which for a Container
// defaults to a Rectangle anchored at its local (0,0) — i.e. the whole hit
// box sat below-and-right of the artwork instead of on top of it, so
// clicking directly on a structure never actually hit anything.
const HIT_AREA = new Phaser.Geom.Rectangle(-65, -120, 130, 200);

export default class VillageScene extends Phaser.Scene {
  constructor() {
    super("VillageScene");
    this.topicSprites = new Map();
    this.openTopicId = null;
  }

  create() {
    // See WarMapScene.create() for why this is here: under this app's dev
    // setup, newly-interactive objects can get stuck in InputPlugin's
    // pending-insertion queue and never receive pointer events until it's
    // force-flushed. Cheap insurance against the same failure mode here.
    this.events.on('update', () => {
      if (this.input._pendingInsertion.length > 0) this.input.preUpdate();
    });

    this.add.text(28, 24, "PERSONAL CODE VILLAGE", { fontFamily: "monospace", fontSize: "14px", color: "#d5a95f" });
    this.add.text(28, 47, "Click a structure to inspect its influence", { fontFamily: "sans-serif", fontSize: "12px", color: "#91a0b3" });
    this.renderVillage(this.data?.village || this.village || { topics: [] });
    this.stateListener = (event) => this.updateVillage(event.detail);
    window.addEventListener("codeforge:village-state", this.stateListener);
    this.events.once("shutdown", () => {
      window.removeEventListener("codeforge:village-state", this.stateListener);
      this.input.setDefaultCursor("default");
    });
  }

  init(data) { this.village = data?.village; }

  renderVillage(village) {
    this.topicSprites.forEach((item) => item.destroy());
    this.topicSprites.clear();
    this.topicPanel?.destroy();
    this.topicPanel = null;
    this.openTopicId = null;
    (village.topics || []).forEach((topic, index) => {
      const column = index % 4; const row = Math.floor(index / 4);
      const x = this.scale.width / 2 + (column - 1.5) * 150 + row * 35;
      const y = 180 + row * 145 - column * 12;
      const band = BAND(topic.level);
      const group = this.add.container(x, y).setSize(130, 200).setInteractive(HIT_AREA, Phaser.Geom.Rectangle.Contains);
      const base = this.add.graphics(); base.fillStyle(0x192532, 0.9).fillEllipse(0, 28, 122, 34);
      const building = this.add.graphics();
      drawStructure(building, topic.structure_key, band, COLORS[band]);
      const label = this.add.text(0, 48, `${topic.display_name || topic.name}\nLV ${topic.level}`, { fontFamily: "monospace", fontSize: "11px", color: "#edf2f7", align: "center" }).setOrigin(.5, 0);
      group.add([base, building, label]);

      group.on("pointerover", () => {
        this.input.setDefaultCursor("pointer");
        drawStructure(building, topic.structure_key, band, HOVER_COLORS[band]);
        this.tweens.add({ targets: group, scale: 1.08, duration: 120, ease: "Sine.Out" });
      });
      group.on("pointerout", () => {
        this.input.setDefaultCursor("default");
        drawStructure(building, topic.structure_key, band, COLORS[band]);
        this.tweens.add({ targets: group, scale: 1, duration: 120, ease: "Sine.In" });
      });
      group.on("pointerdown", () => this.toggleTopic(topic));

      this.topicSprites.set(topic.id || topic.name, group);
    });
  }

  updateVillage(village) { this.village = village; this.renderVillage(village); }

  toggleTopic(topic) {
    const id = topic.id || topic.name;
    if (this.openTopicId === id) {
      this.closeTopic();
      return;
    }
    this.openTopic(topic);
  }

  closeTopic() {
    this.topicPanel?.destroy();
    this.topicPanel = null;
    this.openTopicId = null;
  }

  openTopic(topic) {
    this.topicPanel?.destroy();
    this.openTopicId = topic.id || topic.name;

    const panelWidth = 290;
    const panelHeight = 150;
    this.topicPanel = this.add.container(this.scale.width - panelWidth - 25, 100);

    const background = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x171c26, 0.97)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x2a323d);
    const title = this.add.text(20, 18, topic.display_name || topic.name, { fontFamily: "sans-serif", fontSize: "18px", color: "#f0c777" });
    const closeBtn = this.add.text(panelWidth - 28, 14, "✕", { fontFamily: "sans-serif", fontSize: "16px", color: "#8b96a5" })
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => closeBtn.setColor("#edf2f7"))
      .on("pointerout", () => closeBtn.setColor("#8b96a5"))
      .on("pointerdown", () => this.closeTopic());
    const details = this.add.text(20, 51, `Level ${topic.level}\n${topic.progress_points} progress points\n${topic.points_to_next_level ?? "?"} points to next level`, { fontFamily: "monospace", fontSize: "12px", color: "#c2cedb", lineSpacing: 7 });

    const pct = Math.max(0, Math.min(100, topic.progress_pct ?? 0));
    const barTrack = this.add.rectangle(20, 122, panelWidth - 40, 8, 0x0f151d).setOrigin(0, 0).setStrokeStyle(1, 0x2a323d);
    const barFill = this.add.rectangle(21, 123, Math.max(0, (panelWidth - 42) * (pct / 100)), 6, 0xd5a95f).setOrigin(0, 0);
    const pctLabel = this.add.text(panelWidth - 20, 132, `${pct.toFixed(0)}% to next level`, { fontFamily: "monospace", fontSize: "10px", color: "#8b96a5" }).setOrigin(1, 0);

    this.topicPanel.add([background, title, closeBtn, details, barTrack, barFill, pctLabel]);
    this.topicPanel.setAlpha(0);
    this.tweens.add({ targets: this.topicPanel, alpha: 1, duration: 140 });
  }
}
