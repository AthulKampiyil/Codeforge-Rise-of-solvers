import Phaser from "phaser";
import { CP_VILLAGE_TOPIC_SLOTS, mapVillageProfile, type PresentedTopic } from "../cp/village-presentation";
import { CP_VILLAGE_STATE_EVENT, cpVillageStore, type CPVillageSnapshot } from "../cp/store";
import type { VillageProfile, Wallet } from "../cp/types";

export const CP_VILLAGE_SCENE_KEY = "CPVillageScene";
export const CP_TOPIC_SELECTED_EVENT = "codeforge:topic-selected";
const TILE_WIDTH = 104;
const TILE_HEIGHT = 52;
type VillageSkin = "default" | "pine-dusk" | "amber-paths";
const SKINS: Record<VillageSkin, { background: number; tiles: number[]; path: number; pathLine: number; moss: number; grove: number[] }> = {
  default: { background: 0x173829, tiles: [0x477b4c, 0x426f47, 0x3d7045, 0x4b7a4b, 0x416f48], path: 0x9a8958, pathLine: 0xd8c77c, moss: 0xb8bd71, grove: [0x527947, 0x66854c] },
  "pine-dusk": { background: 0x102a27, tiles: [0x31574f, 0x355d52, 0x2c514c, 0x3b6254, 0x31564d], path: 0x54776d, pathLine: 0x94ab8a, moss: 0x829d83, grove: [0x294f45, 0x3a6654] },
  "amber-paths": { background: 0x173829, tiles: [0x477b4c, 0x426f47, 0x3d7045, 0x4b7a4b, 0x416f48], path: 0xb98d42, pathLine: 0xf1cf78, moss: 0xcbb365, grove: [0x527947, 0x66854c] },
};
const SKIN_BY_ASSET: Record<string, VillageSkin> = { "original:pine-dusk": "pine-dusk", "original:amber-paths": "amber-paths" };
const VISUALS = new Map<string, (typeof CP_VILLAGE_TOPIC_SLOTS)[number]>(CP_VILLAGE_TOPIC_SLOTS.map((slot) => [slot.id, slot]));

/** A render-only view over backend snapshots. It deliberately has no GameModel or simulation. */
export class CPVillageScene extends Phaser.Scene {
  private slotSprites = new Map<string, Phaser.GameObjects.Image>();
  private labels = new Map<string, Phaser.GameObjects.Text>();
  private levelLabels = new Map<string, Phaser.GameObjects.Text>();
  private selectedHalo?: Phaser.GameObjects.Arc;
  private unknownLabel?: Phaser.GameObjects.Text;
  private snapshot?: CPVillageSnapshot;
  private selectedTopicId: string | null = null;
  private dragStart?: { x: number; y: number; scrollX: number; scrollY: number };
  private dragged = false;
  private activePointers = new Map<number, Phaser.Input.Pointer>();
  private pinchDistance = 0;
  private resizeHandler?: (gameSize: Phaser.Structs.Size) => void;
  private stateHandler?: (event: Event) => void;
  private skinHandler?: (event: Event) => void;
  private terrainGraphics?: Phaser.GameObjects.Graphics;
  private groveGraphics?: Phaser.GameObjects.Graphics;
  private visualSkin: VillageSkin = "default";

  constructor() { super({ key: CP_VILLAGE_SCENE_KEY }); }

  preload(): void {
    for (const slot of CP_VILLAGE_TOPIC_SLOTS) this.load.image(slot.id, slot.texture);
  }

  create(data?: { profile?: VillageProfile; wallet?: Wallet }): void {
    this.cameras.main.setBackgroundColor("#173829");
    this.drawIsometricTerrain();
    this.installCameraGestures();
    this.resizeHandler = () => this.fitVillageCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
    this.fitVillageCamera();
    this.stateHandler = (event) => {
      const detail = (event as CustomEvent<CPVillageSnapshot>).detail;
      if (detail) this.applySnapshot(detail);
    };
    this.skinHandler = (event) => {
      const assetRef = (event as CustomEvent<{ assetRef?: unknown }>).detail?.assetRef;
      this.setVillageSkin(assetRef);
    };
    if (typeof window !== "undefined") window.addEventListener(CP_VILLAGE_STATE_EVENT, this.stateHandler);
    if (typeof window !== "undefined") window.addEventListener("codeforge:village-skin", this.skinHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.teardown, this);
    if (data?.profile) this.updateVillage(data.profile, data.wallet ?? null);
    else this.applySnapshot(this.snapshot ?? cpVillageStore.getSnapshot());
    this.setVillageSkin(typeof document === "undefined" ? null : document.body.dataset.cpVillageSkin);
  }

  /** Simple integration API for later Phaser boot/scene.start callers. */
  updateVillage(profile: VillageProfile, wallet: Wallet | null = null): void {
    this.applySnapshot({ village: profile, wallet, layout: null, loading: false, stale: false, error: null, updatedAt: Date.now() });
  }

  applySnapshot(snapshot: CPVillageSnapshot): void {
    const previousUserId = this.snapshot?.village?.user_id;
    const nextUserId = snapshot.village?.user_id;
    if (!nextUserId || (previousUserId && previousUserId !== nextUserId)) this.clearSelection();
    this.snapshot = snapshot;
    if (!snapshot.village) {
      for (const image of this.slotSprites.values()) image.setVisible(false);
      for (const label of this.labels.values()) label.setVisible(false);
      for (const label of this.levelLabels.values()) label.setVisible(false);
      this.unknownLabel?.destroy();
      this.unknownLabel = undefined;
      return;
    }
    const presentation = mapVillageProfile(snapshot.village);
    for (const topic of presentation.slots) this.updateSlot(topic);
    if (this.selectedTopicId && !snapshot.village.topics.some((topic) => topic.id === this.selectedTopicId)) this.clearSelection();
    this.unknownLabel?.destroy();
    const unknown = presentation.unknownTopics.slice(0, 4).map((topic) => topic.displayName).join(" · ");
    this.unknownLabel = unknown ? this.add.text(-380, 320, `Other topics: ${unknown}`, {
      fontFamily: "Arial, sans-serif", fontSize: "16px", color: "#f3e8c8", backgroundColor: "#173829cc", padding: { x: 8, y: 5 },
    }).setDepth(30) : undefined;
  }

  private drawIsometricTerrain(): void {
    this.drawTerrainSurface();
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    this.cameras.main.setBounds(-820, -570, 1640, 1140);
    this.cameras.main.centerOn(0, 0);
    for (const slot of CP_VILLAGE_TOPIC_SLOTS) {
      const x = (slot.x - slot.y) * halfW;
      const y = (slot.x + slot.y) * halfH;
      this.add.ellipse(x + 3, y + 26, 96, 28, 0x102317, 0.48).setDepth(y);
      const plinth = this.add.graphics().setDepth(y + 1);
      plinth.fillStyle(0x263f2c, 1).fillPoints([
        new Phaser.Math.Vector2(x, y + 3), new Phaser.Math.Vector2(x + 49, y + 26),
        new Phaser.Math.Vector2(x, y + 49), new Phaser.Math.Vector2(x - 49, y + 26),
      ], true);
      plinth.fillStyle(0x577747, 1).fillPoints([
        new Phaser.Math.Vector2(x, y - 3), new Phaser.Math.Vector2(x + 49, y + 20),
        new Phaser.Math.Vector2(x, y + 43), new Phaser.Math.Vector2(x - 49, y + 20),
      ], true);
      plinth.lineStyle(1.5, 0xa6a960, 0.62).strokePoints([
        new Phaser.Math.Vector2(x, y - 3), new Phaser.Math.Vector2(x + 49, y + 20),
        new Phaser.Math.Vector2(x, y + 43), new Phaser.Math.Vector2(x - 49, y + 20),
      ], true);
      const image = this.add.image(x, y, slot.id).setDisplaySize(104, 104).setOrigin(0.5, 0.86).setInteractive({ useHandCursor: true }).setDepth(y + 3);
      image.on("pointerup", () => { if (!this.dragged) this.selectTopic(slot.id); });
      this.slotSprites.set(slot.id, image);
      const plaque = this.add.graphics().setDepth(y + 5);
      plaque.fillStyle(0x17281e, 0.94).fillRoundedRect(x - 54, y + 54, 108, 28, 6);
      plaque.lineStyle(1, 0xd6c677, 0.7).strokeRoundedRect(x - 54, y + 54, 108, 28, 6);
      this.labels.set(slot.id, this.add.text(x, y + 58, slot.title, {
        fontFamily: "Nunito Sans, sans-serif", fontSize: "11px", fontStyle: "bold", color: "#f6efd6", align: "center",
        wordWrap: { width: 100, useAdvancedWrap: true },
      }).setOrigin(0.5, 0).setDepth(y + 6));
      this.levelLabels.set(slot.id, this.add.text(x + 36, y - 43, "LV 0", {
        fontFamily: "Nunito Sans, sans-serif", fontSize: "10px", fontStyle: "bold", color: "#f6db8c",
        backgroundColor: "#17281eeF", padding: { x: 6, y: 4 },
      }).setOrigin(0.5).setDepth(y + 7));
    }
  }

  private drawTerrainSurface(): void {
    this.terrainGraphics?.destroy();
    this.groveGraphics?.destroy();
    const colors = SKINS[this.visualSkin];
    // Keep ground beneath even the northmost buildings, whose isometric y-depth is negative.
    const graphics = this.add.graphics().setDepth(-10_000);
    this.terrainGraphics = graphics;
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    for (let row = -6; row <= 6; row++) {
      for (let col = -6; col <= 6; col++) {
        const x = (col - row) * halfW;
        const y = (col + row) * halfH;
        const patch = ((col * 7 + row * 11 + 100) % colors.tiles.length + colors.tiles.length) % colors.tiles.length;
        graphics.fillStyle(colors.tiles[patch], 1);
        graphics.lineStyle(1, this.visualSkin === "pine-dusk" ? 0x1e4039 : 0x294e35, 0.58);
        const diamond = [
          new Phaser.Math.Vector2(x, y - halfH), new Phaser.Math.Vector2(x + halfW, y),
          new Phaser.Math.Vector2(x, y + halfH), new Phaser.Math.Vector2(x - halfW, y),
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
    graphics.lineStyle(28, colors.path, 0.25).beginPath()
      .moveTo(-590, 285).lineTo(-420, 225).lineTo(-310, 260).lineTo(-175, 180)
      .lineTo(-40, 212).lineTo(110, 148).lineTo(270, 194).lineTo(470, 120).strokePath();
    graphics.lineStyle(2, colors.pathLine, 0.46).beginPath()
      .moveTo(-590, 285).lineTo(-420, 225).lineTo(-310, 260).lineTo(-175, 180)
      .lineTo(-40, 212).lineTo(110, 148).lineTo(270, 194).lineTo(470, 120).strokePath();
    const grove = this.add.graphics().setDepth(-9_999);
    this.groveGraphics = grove;
    for (let i = 0; i < 34; i++) {
      const x = -700 + ((i * 193) % 1370);
      const y = -400 + ((i * 127) % 800);
      if (Math.abs(x) < 250 && Math.abs(y) < 170) continue;
      const size = 3 + (i % 4);
      grove.fillStyle(this.visualSkin === "pine-dusk" ? 0x102823 : 0x142f24, 0.38).fillEllipse(x + 3, y + 7, size * 4, size * 1.8);
      grove.fillStyle(colors.grove[i % colors.grove.length], 0.9).fillCircle(x, y, size);
      grove.fillStyle(colors.moss, 0.55).fillCircle(x - size * .35, y - size * .35, size * .42);
    }
  }

  private setVillageSkin(assetRef: unknown): void {
    const nextSkin = typeof assetRef === "string" ? SKIN_BY_ASSET[assetRef] ?? "default" : "default";
    if (nextSkin === this.visualSkin) return;
    this.visualSkin = nextSkin;
    const colors = SKINS[nextSkin];
    this.cameras.main.setBackgroundColor(colors.background);
    if (this.terrainGraphics) this.drawTerrainSurface();
  }

  private updateSlot(topic: PresentedTopic): void {
    const slot = VISUALS.get(topic.slotId);
    const image = this.slotSprites.get(topic.slotId);
    if (!slot || !image) return;
    image.setVisible(true);
    this.labels.get(slot.id)?.setVisible(true);
    // Keep buildings at an intentional screen footprint; setScale() would reset the
    // previous setDisplaySize() to the source PNG's much larger native dimensions.
    const displaySize = 104 * (0.9 + topic.visualTier * 0.035);
    image.setDisplaySize(displaySize, displaySize);
    const levelLabel = this.levelLabels.get(slot.id);
    levelLabel?.setVisible(true).setText(`Lv ${topic.cpLevel}`);
    const label = this.labels.get(slot.id);
    if (label) label.setText(topic.topic?.display_name ?? slot.title);
  }

  private selectTopic(slotId: string): void {
    const mapped = this.snapshot?.village ? mapVillageProfile(this.snapshot.village).slots.find((entry) => entry.slotId === slotId) : undefined;
    const topic = mapped?.topic;
    const topicId = topic?.id;
    if (!topicId || !topic) return;
    const image = this.slotSprites.get(slotId);
    if (!image) return;
    this.selectedHalo?.destroy();
    this.selectedHalo = this.add.circle(image.x, image.y - 4, 59, 0xffe08a, 0.16).setStrokeStyle(3, 0xffe08a, 0.95).setDepth(image.depth - 1);
    this.selectedTopicId = topicId;
    const event = new CustomEvent(CP_TOPIC_SELECTED_EVENT, { detail: { topicId } });
    if (typeof window !== "undefined") window.dispatchEvent(event);
  }

  /** Frame the entire topic ring on first load and keep it usable on narrow screens. */
  private fitVillageCamera(): void {
    const camera = this.cameras.main;
    camera.setViewport(0, 0, this.scale.width, this.scale.height);
    const halfW = TILE_WIDTH / 2;
    const halfH = TILE_HEIGHT / 2;
    const projected = CP_VILLAGE_TOPIC_SLOTS.map((slot) => ({
      x: (slot.x - slot.y) * halfW,
      y: (slot.x + slot.y) * halfH,
    }));
    const minX = Math.min(...projected.map((p) => p.x)) - 105;
    const maxX = Math.max(...projected.map((p) => p.x)) + 105;
    const minY = Math.min(...projected.map((p) => p.y)) - 120;
    const maxY = Math.max(...projected.map((p) => p.y)) + 115;
    const fit = Math.min((this.scale.width - 32) / (maxX - minX), (this.scale.height - 32) / (maxY - minY), 1.08);
    camera.setZoom(Phaser.Math.Clamp(fit, 0.36, 1.08));
    camera.centerOn((minX + maxX) / 2, (minY + maxY) / 2);
  }

  private clearSelection(): void {
    this.selectedTopicId = null;
    this.selectedHalo?.destroy();
    this.selectedHalo = undefined;
  }

  private installCameraGestures(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.activePointers.set(pointer.id, pointer);
      this.dragStart = { x: pointer.x, y: pointer.y, scrollX: this.cameras.main.scrollX, scrollY: this.cameras.main.scrollY };
      if (this.activePointers.size === 2) this.pinchDistance = this.pointerDistance();
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      if (this.activePointers.size > 1) {
        const distance = this.pointerDistance();
        if (this.pinchDistance > 0 && distance > 0) this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * distance / this.pinchDistance, 0.36, 1.7));
        this.pinchDistance = distance;
        return;
      }
      if (!this.dragStart) return;
      const dx = pointer.x - this.dragStart.x;
      const dy = pointer.y - this.dragStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) this.dragged = true;
      this.cameras.main.scrollX = this.dragStart.scrollX - dx / this.cameras.main.zoom;
      this.cameras.main.scrollY = this.dragStart.scrollY - dy / this.cameras.main.zoom;
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      this.activePointers.delete(pointer.id);
      if (this.activePointers.size < 2) this.pinchDistance = 0;
      this.dragStart = undefined;
      this.time.delayedCall(0, () => { this.dragged = false; });
    });
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _objects: unknown[], _dx: number, dy: number) => {
      this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom * (dy > 0 ? 0.92 : 1.08), 0.36, 1.7));
    });
  }

  private pointerDistance(): number {
    const [a, b] = [...this.activePointers.values()];
    return a && b ? Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) : 0;
  }

  private teardown(): void {
    if (this.resizeHandler) this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler, this);
    if (this.stateHandler && typeof window !== "undefined") window.removeEventListener(CP_VILLAGE_STATE_EVENT, this.stateHandler);
    if (this.skinHandler && typeof window !== "undefined") window.removeEventListener("codeforge:village-skin", this.skinHandler);
    this.input.removeAllListeners();
    this.slotSprites.clear();
    this.labels.clear();
    this.levelLabels.clear();
    this.activePointers.clear();
    this.clearSelection();
    this.resizeHandler = undefined;
    this.stateHandler = undefined;
    this.skinHandler = undefined;
  }
}

export function createCPVillageGameConfig(parent: string | HTMLElement, width = 960, height = 640): Phaser.Types.Core.GameConfig {
  return { type: Phaser.AUTO, parent, width, height, backgroundColor: "#173829", scene: [CPVillageScene], scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH } };
}
