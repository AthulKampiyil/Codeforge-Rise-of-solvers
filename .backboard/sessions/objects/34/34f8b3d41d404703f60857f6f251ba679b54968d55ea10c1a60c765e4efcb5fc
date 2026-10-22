import Phaser from "phaser";

const TILE_WIDTH = 104;
const TILE_HEIGHT = 52;
const HALF_W = 52;
const HALF_H = 26;

export const TOPIC_SLOTS = [
  { slug: "arrays", title: "Arrays", textureKey: "building-barracks", textureUrl: "/assets/buildings/barracks.webp", x: -4, y: -3 },
  { slug: "strings", title: "Strings", textureKey: "building-camp", textureUrl: "/assets/buildings/camp.webp", x: -1, y: -5 },
  { slug: "math", title: "Math", textureKey: "building-blacksmith", textureUrl: "/assets/buildings/blacksmith.webp", x: 3, y: -4 },
  { slug: "greedy", title: "Greedy", textureKey: "building-wizardtower", textureUrl: "/assets/buildings/wizardtower.webp", x: -6, y: -1 },
  { slug: "graphs", title: "Graphs", textureKey: "building-archertower", textureUrl: "/assets/buildings/archertower.webp", x: 6, y: 1 },
  { slug: "trees", title: "Trees", textureKey: "building-laboratory", textureUrl: "/assets/buildings/laboratory.webp", x: -5, y: 4 },
  { slug: "dynamic-programming", title: "DP", textureKey: "building-cannon", textureUrl: "/assets/buildings/cannon.webp", x: 0, y: 6 },
  { slug: "data-structures", title: "Data Structures", textureKey: "building-builder", textureUrl: "/assets/buildings/builder.webp", x: 5, y: 4 },
];

const TOPIC_ALIASES = {
  array: "arrays",
  arrays: "arrays",
  hut: "arrays",
  string: "strings",
  strings: "strings",
  library: "strings",
  math: "math",
  mathematics: "math",
  observatory: "math",
  greedy: "greedy",
  mill: "greedy",
  graph: "graphs",
  graphs: "graphs",
  tower: "graphs",
  tree: "trees",
  trees: "trees",
  grove: "trees",
  dp: "dynamic-programming",
  fortress: "dynamic-programming",
  "dynamic-programming": "dynamic-programming",
  "dynamic programming": "dynamic-programming",
  "data structure": "data-structures",
  "data structures": "data-structures",
  "data-structures": "data-structures",
  vault: "data-structures",
};

function normalizeTopicKey(key) {
  if (!key) return "";
  return key.trim().toLowerCase().replace(/[_-]+/g, " ");
}

function findTopicForSlot(topics, slot) {
  if (!topics || !Array.isArray(topics)) return null;
  return topics.find((t) => {
    const nameMatch = TOPIC_ALIASES[normalizeTopicKey(t.name)] === slot.slug || normalizeTopicKey(t.name) === slot.slug;
    const keyMatch = TOPIC_ALIASES[normalizeTopicKey(t.structure_key)] === slot.slug;
    const displayMatch = TOPIC_ALIASES[normalizeTopicKey(t.display_name)] === slot.slug;
    return nameMatch || keyMatch || displayMatch;
  }) || null;
}

export default class VillageScene extends Phaser.Scene {
  constructor() {
    super("VillageScene");
    this.slotNodes = new Map();
    this.selectedTopicSlug = null;
    this.selectedHalo = null;
    this.topicPanel = null;
    this.dragStart = null;
    this.dragged = false;
    this.activePointers = new Map();
    this.pinchDistance = 0;
  }

  init(data) {
    this.village = data?.village || null;
  }

  preload() {
    TOPIC_SLOTS.forEach((slot) => {
      if (!this.textures.exists(slot.textureKey)) {
        this.load.image(slot.textureKey, slot.textureUrl);
      }
    });
  }

  create() {
    this.cameras.main.setBackgroundColor("#173829");
    this.cameras.main.setBounds(-900, -650, 1800, 1300);

    // Draw isometric grass terrain, paths, and pine grove
    this.drawIsometricTerrain();

    // Create building slot entities
    this.createSlotEntities();

    // Draw top HUD banner
    this.createHeaderHUD();

    // Gesture controls: drag to pan, wheel / pinch to zoom
    this.installCameraGestures();

    // Auto-fit camera framing
    this.fitVillageCamera();
    this.resizeHandler = () => {
      this.fitVillageCamera();
      if (this.topicPanel) {
        this.topicPanel.x = Math.max(20, this.scale.width - 344);
      }
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);

    // Initial render with existing data if present
    const initialVillage = this.village || (typeof window !== "undefined" ? window.__codeforgeVillageState : null);
    if (initialVillage) {
      this.renderVillage(initialVillage);
    }

    // Listen to live village updates
    this.stateListener = (event) => {
      if (event?.detail) {
        this.updateVillage(event.detail);
      }
    };
    window.addEventListener("codeforge:village-state", this.stateListener);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.teardown, this);
  }

  drawIsometricTerrain() {
    this.terrainGraphics?.destroy();
    this.groveGraphics?.destroy();

    const colors = {
      tiles: [0x477b4c, 0x426f47, 0x3d7045, 0x4b7a4b, 0x416f48],
      path: 0x9a8958,
      pathLine: 0xd8c77c,
      moss: 0xb8bd71,
      grove: [0x527947, 0x66854c],
    };

    const graphics = this.add.graphics().setDepth(-10000);
    this.terrainGraphics = graphics;

    // Diamond grid
    for (let row = -8; row <= 8; row++) {
      for (let col = -8; col <= 8; col++) {
        const x = (col - row) * HALF_W;
        const y = (col + row) * HALF_H;
        const patch = ((col * 7 + row * 11 + 100) % colors.tiles.length + colors.tiles.length) % colors.tiles.length;
        graphics.fillStyle(colors.tiles[patch], 1);
        graphics.lineStyle(1, 0x294e35, 0.55);
        const diamond = [
          new Phaser.Math.Vector2(x, y - HALF_H),
          new Phaser.Math.Vector2(x + HALF_W, y),
          new Phaser.Math.Vector2(x, y + HALF_H),
          new Phaser.Math.Vector2(x - HALF_W, y),
        ];
        graphics.fillPoints(diamond, true);
        graphics.strokePoints(diamond, true);

        const markX = x + ((col * 17 + row * 9) % 29) - 14;
        const markY = y + ((col * 5 - row * 13) % 13) - 6;
        if ((col + row * 2) % 4 === 0) {
          graphics.fillStyle(colors.moss, 0.32).fillEllipse(markX, markY, 9, 3);
          graphics.fillStyle(colors.moss, 0.28).fillCircle(markX + 5, markY - 2, 1.2);
        } else if ((col * 3 + row) % 7 === 0) {
          graphics.fillStyle(0x213f30, 0.38).fillCircle(markX, markY, 2.5);
        }
      }
    }

    // Winding stone path through the village
    graphics.lineStyle(28, colors.path, 0.24).beginPath()
      .moveTo(-590, 285).lineTo(-420, 225).lineTo(-310, 260).lineTo(-175, 180)
      .lineTo(-40, 212).lineTo(110, 148).lineTo(270, 194).lineTo(470, 120).strokePath();
    graphics.lineStyle(2, colors.pathLine, 0.45).beginPath()
      .moveTo(-590, 285).lineTo(-420, 225).lineTo(-310, 260).lineTo(-175, 180)
      .lineTo(-40, 212).lineTo(110, 148).lineTo(270, 194).lineTo(470, 120).strokePath();

    // Perimeter pine trees around clearing
    const grove = this.add.graphics().setDepth(-9999);
    this.groveGraphics = grove;
    for (let i = 0; i < 48; i++) {
      const x = -750 + ((i * 193) % 1500);
      const y = -450 + ((i * 127) % 900);
      if (Math.abs(x) < 320 && Math.abs(y) < 220) continue;
      const size = 3 + (i % 4);
      grove.fillStyle(0x142f24, 0.38).fillEllipse(x + 3, y + 7, size * 4, size * 1.8);
      grove.fillStyle(colors.grove[i % colors.grove.length], 0.9).fillCircle(x, y, size);
      grove.fillStyle(colors.moss, 0.55).fillCircle(x - size * 0.35, y - size * 0.35, size * 0.42);
    }
  }

  createSlotEntities() {
    this.slotNodes.forEach((node) => {
      node.shadow?.destroy();
      node.plinth?.destroy();
      node.image?.destroy();
      node.plaque?.destroy();
      node.titleText?.destroy();
      node.levelBadge?.destroy();
    });
    this.slotNodes.clear();

    TOPIC_SLOTS.forEach((slot) => {
      const x = (slot.x - slot.y) * HALF_W;
      const y = (slot.x + slot.y) * HALF_H;

      // Base drop-shadow ellipse
      const shadow = this.add.ellipse(x + 3, y + 26, 96, 28, 0x102317, 0.48).setDepth(y);

      // Stone Plinth (Pedestal)
      const plinth = this.add.graphics().setDepth(y + 1);
      plinth.fillStyle(0x263f2c, 1).fillPoints([
        new Phaser.Math.Vector2(x, y + 3),
        new Phaser.Math.Vector2(x + 49, y + 26),
        new Phaser.Math.Vector2(x, y + 49),
        new Phaser.Math.Vector2(x - 49, y + 26),
      ], true);
      plinth.fillStyle(0x577747, 1).fillPoints([
        new Phaser.Math.Vector2(x, y - 3),
        new Phaser.Math.Vector2(x + 49, y + 20),
        new Phaser.Math.Vector2(x, y + 43),
        new Phaser.Math.Vector2(x - 49, y + 20),
      ], true);
      plinth.lineStyle(1.5, 0xa6a960, 0.62).strokePoints([
        new Phaser.Math.Vector2(x, y - 3),
        new Phaser.Math.Vector2(x + 49, y + 20),
        new Phaser.Math.Vector2(x, y + 43),
        new Phaser.Math.Vector2(x - 49, y + 20),
      ], true);

      // WebP Building Sprite
      const image = this.add.image(x, y, slot.textureKey)
        .setDisplaySize(104, 104)
        .setOrigin(0.5, 0.86)
        .setInteractive({ useHandCursor: true })
        .setDepth(y + 3);

      // Plaque nameplate
      const plaque = this.add.graphics().setDepth(y + 5);
      plaque.fillStyle(0x17281e, 0.94).fillRoundedRect(x - 56, y + 48, 112, 28, 6);
      plaque.lineStyle(1, 0xd6c677, 0.7).strokeRoundedRect(x - 56, y + 48, 112, 28, 6);

      const titleText = this.add.text(x, y + 54, slot.title, {
        fontFamily: "Inter, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#f6efd6",
        align: "center",
        wordWrap: { width: 104 },
      }).setOrigin(0.5, 0).setDepth(y + 6);

      // Floating level badge
      const levelBadge = this.add.text(x + 36, y - 43, "LV 1", {
        fontFamily: "Inter, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#f6db8c",
        backgroundColor: "#17281eee",
        padding: { x: 6, y: 4 },
      }).setOrigin(0.5).setDepth(y + 7);

      const slotNode = {
        slot,
        x,
        y,
        baseSize: 104,
        shadow,
        plinth,
        image,
        plaque,
        titleText,
        levelBadge,
        topic: null,
      };

      image.on("pointerover", () => {
        this.input.setDefaultCursor("pointer");
        this.tweens.add({
          targets: image,
          scale: (image.baseDisplayScale || (image.displayWidth / 104)) * 1.05,
          duration: 120,
          ease: "Quad.Out",
        });
      });

      image.on("pointerout", () => {
        this.input.setDefaultCursor("default");
        this.tweens.add({
          targets: image,
          scale: image.baseDisplayScale || 1,
          duration: 120,
          ease: "Quad.In",
        });
      });

      image.on("pointerup", () => {
        if (!this.dragged) {
          this.selectTopic(slot.slug);
        }
      });

      this.slotNodes.set(slot.slug, slotNode);
    });
  }

  createHeaderHUD() {
    const hud = this.add.container(20, 16).setScrollFactor(0).setDepth(15000);
    const bg = this.add.graphics();
    bg.fillStyle(0x10281e, 0.88).fillRoundedRect(0, 0, 320, 52, 8);
    bg.lineStyle(1, 0x3d7045, 0.8).strokeRoundedRect(0, 0, 320, 52, 8);

    const title = this.add.text(14, 9, "⚔ PERSONAL CODE VILLAGE", {
      fontFamily: "Inter, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#fbbf24",
      letterSpacing: "0.5px",
    });

    const hint = this.add.text(14, 29, "Click structure to inspect · Drag to pan · Scroll to zoom", {
      fontFamily: "Inter, sans-serif",
      fontSize: "11px",
      color: "#94a3b8",
    });

    hud.add([bg, title, hint]);
  }

  renderVillage(village) {
    this.village = village;
    const topics = village?.topics || [];

    this.slotNodes.forEach((node, slug) => {
      const topic = findTopicForSlot(topics, node.slot);
      node.topic = topic;

      const level = Math.max(1, topic?.level ?? 1);
      const displayName = topic?.display_name || topic?.name || node.slot.title;

      node.titleText.setText(displayName);
      node.levelBadge.setText(`LV ${level}`);

      // Level-based visual scaling
      const visualTier = Math.min(5, Math.max(0, level));
      const targetSize = node.baseSize * (0.92 + visualTier * 0.035);
      node.image.setDisplaySize(targetSize, targetSize);
      node.image.baseDisplayScale = node.image.scaleX;
    });

    // If an inspector panel is currently open, refresh its content
    if (this.selectedTopicSlug) {
      const node = this.slotNodes.get(this.selectedTopicSlug);
      if (node) {
        this.openTopic(node.topic, node.slot);
      }
    }
  }

  updateVillage(village) {
    this.renderVillage(village);
  }

  selectTopic(slug) {
    if (this.selectedTopicSlug === slug && this.topicPanel) {
      this.closeTopic();
      return;
    }

    const node = this.slotNodes.get(slug);
    if (!node) return;

    this.selectedTopicSlug = slug;

    // Glowing halo on the ground beneath the selected building
    this.selectedHalo?.destroy();
    this.selectedHalo = this.add.circle(node.x, node.y - 4, 60, 0xffe08a, 0.22)
      .setStrokeStyle(3, 0xffe08a, 0.95)
      .setDepth(node.y + 2);

    // Bounce tween on the building
    this.tweens.add({
      targets: node.image,
      y: node.y - 10,
      duration: 140,
      yoyo: true,
      ease: "Quad.Out",
    });

    // Open detailed inspector card
    this.openTopic(node.topic, node.slot);

    // Emit event for external listeners
    if (node.topic?.id) {
      window.dispatchEvent(new CustomEvent("codeforge:topic-selected", { detail: { topicId: node.topic.id } }));
    }
  }

  openTopic(topic, slot) {
    this.closeTopic(false);

    const displayName = topic?.display_name || topic?.name || slot?.title || "Topic";
    const level = Math.max(1, topic?.level ?? 1);
    const progressPoints = topic?.progress_points ?? 0;
    const pointsToNext = topic?.points_to_next_level ?? "—";
    const pct = Math.max(0, Math.min(100, topic?.progress_pct ?? 0));

    const panelWidth = 320;
    const panelHeight = 175;
    const panelX = Math.max(20, this.scale.width - panelWidth - 24);
    const panelY = 20;

    const panel = this.add.container(panelX, panelY).setScrollFactor(0).setDepth(20000);
    this.topicPanel = panel;

    const bg = this.add.graphics();
    bg.fillStyle(0x10281e, 0.95).fillRoundedRect(0, 0, panelWidth, panelHeight, 10);
    bg.lineStyle(1.5, 0xd6c677, 0.9).strokeRoundedRect(0, 0, panelWidth, panelHeight, 10);

    const title = this.add.text(20, 18, displayName, {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fbbf24",
    });

    const levelBadge = this.add.text(20, 46, `${slot?.title || "Topic"} Outpost · Level ${level}`, {
      fontFamily: "Inter, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#34d399",
    });

    const closeBtn = this.add.text(panelWidth - 28, 16, "✕", {
      fontFamily: "sans-serif",
      fontSize: "18px",
      color: "#94a3b8",
    }).setInteractive({ useHandCursor: true })
      .on("pointerover", () => closeBtn.setColor("#ffffff"))
      .on("pointerout", () => closeBtn.setColor("#94a3b8"))
      .on("pointerdown", () => this.closeTopic(true));

    const details = this.add.text(20, 74, `Progress: ${progressPoints} points\nRequired for next level: ${pointsToNext}`, {
      fontFamily: "Inter, sans-serif",
      fontSize: "12px",
      color: "#cbd5e1",
      lineSpacing: 5,
    });

    const barTrack = this.add.graphics();
    barTrack.fillStyle(0x173829, 1).fillRoundedRect(20, 130, panelWidth - 40, 8, 4);

    const barFill = this.add.graphics();
    const fillW = Math.max(8, (panelWidth - 40) * (pct / 100));
    barFill.fillStyle(0x34d399, 1).fillRoundedRect(20, 130, fillW, 8, 4);

    const pctLabel = this.add.text(panelWidth - 20, 114, `${pct.toFixed(0)}% to next level`, {
      fontFamily: "Inter, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: "#86efac",
    }).setOrigin(1, 0);

    panel.add([bg, title, levelBadge, closeBtn, details, barTrack, barFill, pctLabel]);

    panel.setAlpha(0);
    panel.setScale(0.95);
    this.tweens.add({ targets: panel, alpha: 1, scale: 1, duration: 160, ease: "Back.Out" });
  }

  closeTopic(deselect = true) {
    if (deselect) {
      this.selectedTopicSlug = null;
      this.selectedHalo?.destroy();
      this.selectedHalo = null;
    }
    if (this.topicPanel) {
      const panelToDestroy = this.topicPanel;
      this.topicPanel = null;
      this.tweens.add({
        targets: panelToDestroy,
        alpha: 0,
        scale: 0.95,
        duration: 120,
        onComplete: () => {
          panelToDestroy.destroy();
        },
      });
    }
  }

  fitVillageCamera() {
    const camera = this.cameras.main;
    camera.setViewport(0, 0, this.scale.width, this.scale.height);

    const projected = TOPIC_SLOTS.map((slot) => ({
      x: (slot.x - slot.y) * HALF_W,
      y: (slot.x + slot.y) * HALF_H,
    }));

    const minX = Math.min(...projected.map((p) => p.x)) - 130;
    const maxX = Math.max(...projected.map((p) => p.x)) + 130;
    const minY = Math.min(...projected.map((p) => p.y)) - 140;
    const maxY = Math.max(...projected.map((p) => p.y)) + 130;

    const fit = Math.min((this.scale.width - 32) / (maxX - minX), (this.scale.height - 32) / (maxY - minY), 1.05);
    camera.setZoom(Phaser.Math.Clamp(fit, 0.45, 1.15));
    camera.centerOn((minX + maxX) / 2, (minY + maxY) / 2);
  }

  installCameraGestures() {
    this.input.on("pointerdown", (pointer) => {
      this.activePointers.set(pointer.id, pointer);
      this.dragStart = {
        x: pointer.x,
        y: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
      };
      if (this.activePointers.size === 2) {
        this.pinchDistance = this.pointerDistance();
      }
    });

    this.input.on("pointermove", (pointer) => {
      if (!pointer.isDown) return;

      if (this.activePointers.size > 1) {
        const distance = this.pointerDistance();
        if (this.pinchDistance > 0 && distance > 0) {
          const newZoom = (this.cameras.main.zoom * distance) / this.pinchDistance;
          this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.45, 1.6));
        }
        this.pinchDistance = distance;
        return;
      }

      if (!this.dragStart) return;
      const dx = pointer.x - this.dragStart.x;
      const dy = pointer.y - this.dragStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) {
        this.dragged = true;
      }
      this.cameras.main.scrollX = this.dragStart.scrollX - dx / this.cameras.main.zoom;
      this.cameras.main.scrollY = this.dragStart.scrollY - dy / this.cameras.main.zoom;
    });

    this.input.on("pointerup", (pointer) => {
      this.activePointers.delete(pointer.id);
      if (this.activePointers.size < 2) {
        this.pinchDistance = 0;
      }
      this.dragStart = null;
      this.time.delayedCall(50, () => {
        this.dragged = false;
      });
    });

    this.input.on("wheel", (_pointer, _objects, _dx, dy) => {
      const currentZoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(currentZoom * (dy > 0 ? 0.92 : 1.08), 0.45, 1.6);
      this.cameras.main.setZoom(newZoom);
    });
  }

  pointerDistance() {
    const [a, b] = [...this.activePointers.values()];
    return a && b ? Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) : 0;
  }

  teardown() {
    if (this.resizeHandler) {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
      this.resizeHandler = null;
    }
    if (this.stateListener && typeof window !== "undefined") {
      window.removeEventListener("codeforge:village-state", this.stateListener);
      this.stateListener = null;
    }
    this.input.removeAllListeners();
    this.input.setDefaultCursor("default");
    this.closeTopic(true);
    this.slotNodes.clear();
    this.activePointers.clear();
  }
}
