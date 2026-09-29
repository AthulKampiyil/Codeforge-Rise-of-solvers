import Phaser from "phaser";

const BAND = (level) => level >= 10 ? 4 : level >= 6 ? 3 : level >= 3 ? 2 : level >= 1 ? 1 : 0;

// Upgraded rich color palette with pre-calculated shades to avoid in-place mutation issues
const PALETTE = [
  { main: 0x475569, dark: 0x334155, light: 0x64748b },
  { main: 0x14b8a6, dark: 0x0f766e, light: 0x2dd4bf },
  { main: 0x3b82f6, dark: 0x1d4ed8, light: 0x60a5fa },
  { main: 0xf59e0b, dark: 0xb45309, light: 0xfbbf24 },
  { main: 0xef4444, dark: 0xb91c1c, light: 0xf87171 }
];

function drawStructure(graphics, structureKey, band, isHover) {
  graphics.clear();
  
  const colors = PALETTE[band];
  // If hovering, use the light variant as the main color, main as dark, etc.
  const mainColor = isHover ? colors.light : colors.main;
  const darkColor = isHover ? colors.main : colors.dark;
  const lightColor = isHover ? 0xffffff : colors.light;
  
  const roofColor = 0x1e293b;
  const windowColor = 0xfde047; // Glowing yellow
  
  const width = 24 + band * 6;
  const height = 28 + band * 8;
  const yOffset = height / 2;
  
  if (structureKey === "grove") {
    // Beautiful stylized tree
    const trunkW = 8 + band * 2;
    const trunkH = 16 + band * 4;
    
    // Trunk
    graphics.fillStyle(0x78350f, 1);
    graphics.fillRect(-trunkW/2, yOffset - trunkH, trunkW, trunkH);
    
    // Leaves (overlapping circles)
    graphics.fillStyle(mainColor, 1);
    const r1 = 18 + band * 3;
    const r2 = 14 + band * 2.5;
    
    // Base leaves
    graphics.fillCircle(-r1*0.6, yOffset - trunkH - r1*0.2, r2);
    graphics.fillCircle(r1*0.6, yOffset - trunkH - r1*0.2, r2);
    
    // Top canopy
    graphics.fillStyle(lightColor, 1);
    graphics.fillCircle(0, yOffset - trunkH - r1*0.6, r1);
    
  } else {
    // Isometric-ish modern stylized building
    
    // Main Building Body
    graphics.fillStyle(mainColor, 1);
    graphics.fillRect(-width, -yOffset, width * 2, height);
    
    // Shadow / Depth side
    graphics.fillStyle(darkColor, 1);
    graphics.fillRect(0, -yOffset, width, height);
    
    // Roof
    graphics.fillStyle(roofColor, 1);
    if (structureKey === "tower" || structureKey === "observatory") {
      graphics.fillTriangle(-width - 8, -yOffset, width + 8, -yOffset, 0, -yOffset - 35 - band * 5);
      // Roof highlight
      graphics.fillStyle(0x334155, 1);
      graphics.fillTriangle(0, -yOffset, width + 8, -yOffset, 0, -yOffset - 35 - band * 5);
    } else if (structureKey === "fortress") {
      graphics.fillRect(-width - 4, -yOffset - 10, width * 2 + 8, 10);
      graphics.fillStyle(0x334155, 1);
      graphics.fillRect(0, -yOffset - 10, width + 4, 10);
      // Crenellations
      for(let i=0; i<3; i++) {
        graphics.fillStyle(roofColor, 1);
        graphics.fillRect(-width + i*(width*0.8) - 2, -yOffset - 16, width*0.4, 6);
      }
    } else {
      // Standard A-Frame
      graphics.fillTriangle(-width - 10, -yOffset, width + 10, -yOffset, 0, -yOffset - 25 - band * 4);
      graphics.fillStyle(0x334155, 1);
      graphics.fillTriangle(0, -yOffset, width + 10, -yOffset, 0, -yOffset - 25 - band * 4);
    }
    
    // Door
    const doorW = 12 + band * 2;
    const doorH = 16 + band * 3;
    graphics.fillStyle(0x0f172a, 1);
    graphics.fillRect(-doorW/2, yOffset - doorH, doorW, doorH);
    
    // Windows
    if (band > 0) {
      graphics.fillStyle(windowColor, 0.8);
      const winSize = 6 + band;
      if (structureKey === "tower") {
        for(let i=1; i<=band; i++) {
          graphics.fillRect(-winSize/2, yOffset - doorH - 12 - (i * (winSize + 8)), winSize, winSize);
        }
      } else {
        graphics.fillRect(-width/2 - winSize/2, 0, winSize, winSize);
        graphics.fillRect(width/2 - winSize/2, 0, winSize, winSize);
        if (band > 2) {
          graphics.fillRect(-width/2 - winSize/2, -yOffset + winSize + 4, winSize, winSize);
          graphics.fillRect(width/2 - winSize/2, -yOffset + winSize + 4, winSize, winSize);
        }
      }
    }
  }
}

const HIT_AREA = new Phaser.Geom.Rectangle(-65, -120, 130, 200);

export default class VillageScene extends Phaser.Scene {
  constructor() {
    super("VillageScene");
    this.topicSprites = new Map();
    this.openTopicId = null;
  }

  create() {
    this.events.on('update', () => {
      if (this.input._pendingInsertion.length > 0) this.input.preUpdate();
    });

    this.add.text(28, 24, "PERSONAL CODE VILLAGE", { fontFamily: "Inter, sans-serif", fontSize: "16px", fontWeight: "bold", color: "#fbbf24", letterSpacing: "1px" });
    this.add.text(28, 47, "Click a structure to inspect its influence", { fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#94a3b8" });
    
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
      const x = this.scale.width / 2 + (column - 1.5) * 160 + row * 40;
      const y = 200 + row * 160 - column * 15;
      const band = BAND(topic.level);
      
      const group = this.add.container(x, y).setSize(130, 200).setInteractive(HIT_AREA, Phaser.Geom.Rectangle.Contains);
      
      // Shadow / Base
      const base = this.add.graphics(); 
      base.fillStyle(0x020617, 0.4).fillEllipse(0, 45, 140, 30);
      
      const building = this.add.graphics();
      drawStructure(building, topic.structure_key, band, false);
      
      // Beautiful Badge Label
      const labelBg = this.add.graphics();
      labelBg.fillStyle(0x0f172a, 0.8).fillRoundedRect(-50, 65, 100, 36, 6).lineStyle(1, 0x334155, 1).strokeRoundedRect(-50, 65, 100, 36, 6);
      
      const labelText = this.add.text(0, 72, `${topic.display_name || topic.name}`, { fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: "600", color: "#f8fafc", align: "center" }).setOrigin(.5, 0);
      const lvText = this.add.text(0, 88, `LV ${topic.level}`, { fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: "bold", color: "#34d399", align: "center" }).setOrigin(.5, 0);
      
      group.add([base, building, labelBg, labelText, lvText]);

      group.on("pointerover", () => {
        this.input.setDefaultCursor("pointer");
        drawStructure(building, topic.structure_key, band, true);
        this.tweens.add({ targets: group, scale: 1.05, y: y - 5, duration: 150, ease: "Back.Out" });
      });
      group.on("pointerout", () => {
        this.input.setDefaultCursor("default");
        drawStructure(building, topic.structure_key, band, false);
        this.tweens.add({ targets: group, scale: 1, y: y, duration: 150, ease: "Back.In" });
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
    if (this.topicPanel) {
      this.tweens.add({
        targets: this.topicPanel, alpha: 0, scale: 0.95, duration: 120, 
        onComplete: () => { this.topicPanel?.destroy(); this.topicPanel = null; }
      });
    }
    this.openTopicId = null;
  }

  openTopic(topic) {
    this.topicPanel?.destroy();
    this.openTopicId = topic.id || topic.name;

    const panelWidth = 300;
    const panelHeight = 160;
    this.topicPanel = this.add.container(this.scale.width - panelWidth - 30, 100);

    const background = this.add.graphics();
    background.fillStyle(0x1e293b, 0.95)
      .fillRoundedRect(0, 0, panelWidth, panelHeight, 12)
      .lineStyle(1, 0x334155, 1)
      .strokeRoundedRect(0, 0, panelWidth, panelHeight, 12);

    const title = this.add.text(24, 20, topic.display_name || topic.name, { fontFamily: "Inter, sans-serif", fontSize: "20px", fontWeight: "bold", color: "#fbbf24" });
    const closeBtn = this.add.text(panelWidth - 32, 18, "✕", { fontFamily: "sans-serif", fontSize: "18px", color: "#94a3b8" })
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => closeBtn.setColor("#f8fafc"))
      .on("pointerout", () => closeBtn.setColor("#94a3b8"))
      .on("pointerdown", () => this.closeTopic());
      
    const details = this.add.text(24, 56, `Level ${topic.level}\n${topic.progress_points} progress points\n${topic.points_to_next_level ?? "?"} points to next level`, { fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#cbd5e1", lineSpacing: 8 });

    const pct = Math.max(0, Math.min(100, topic.progress_pct ?? 0));
    const barTrack = this.add.graphics().fillStyle(0x0f172a, 1).fillRoundedRect(24, 130, panelWidth - 48, 8, 4);
    const barFill = this.add.graphics().fillStyle(0x34d399, 1).fillRoundedRect(24, 130, Math.max(8, (panelWidth - 48) * (pct / 100)), 8, 4);
    
    const pctLabel = this.add.text(panelWidth - 24, 114, `${pct.toFixed(0)}% to next level`, { fontFamily: "Inter, sans-serif", fontSize: "11px", fontWeight: "bold", color: "#94a3b8" }).setOrigin(1, 0);

    this.topicPanel.add([background, title, closeBtn, details, barTrack, barFill, pctLabel]);
    
    this.topicPanel.setAlpha(0);
    this.topicPanel.setScale(0.95);
    this.tweens.add({ targets: this.topicPanel, alpha: 1, scale: 1, duration: 200, ease: "Back.Out" });
  }
}
