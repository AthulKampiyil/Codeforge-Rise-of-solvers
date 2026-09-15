import Phaser from 'phaser';

export default class WarMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WarMapScene' });
        this.zonesData = [];
        this.zoneObjects = [];
        this.guildColors = {}; // guild_id -> color hex
        this.colorPalette = [0x8b5cf6, 0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0xec4899, 0x06b6d4];
        this.nextColorIdx = 0;
    }

    init(data) {
        this.zonesData = data.zones || [];
        this.assignGuildColors();
    }

    assignGuildColors() {
        this.zonesData.forEach(z => {
            if (z.owning_guild_id && !this.guildColors[z.owning_guild_id]) {
                this.guildColors[z.owning_guild_id] = this.colorPalette[this.nextColorIdx % this.colorPalette.length];
                this.nextColorIdx++;
            }
        });
    }

    updateZones(zones) {
        this.zonesData = zones || [];
        this.assignGuildColors();
        this.renderZones();
        this.renderLegend();
    }

    getGuildColor(guildId) {
        if (!guildId) return 0x2a323d; // unowned neutral
        if (!this.guildColors[guildId]) {
            this.guildColors[guildId] = this.colorPalette[this.nextColorIdx % this.colorPalette.length];
            this.nextColorIdx++;
        }
        return this.guildColors[guildId];
    }

    create() {
        this.cameras.main.setBackgroundColor('#05080c');

        // Hex grid or subtle dot grid
        for(let x = 0; x < 800; x += 40) {
            for(let y = 0; y < 600; y += 40) {
                this.add.circle(x, y, 1, 0x2a323d, 0.4);
            }
        }

        // Top UI Text
        this.add.text(20, 20, 'GLOBAL STRATEGY MAP', {
            fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', fill: '#ffffff', letterSpacing: 2
        }).setAlpha(0.9);

        // Legend (Accessibility - Never color alone)
        this.legendContainer = this.add.container(20, 500);
        this.renderLegend();

        // Tooltip container
        this.tooltip = this.add.container(0, 0).setDepth(100).setAlpha(0);
        const tooltipBg = this.add.rectangle(0, 0, 200, 70, 0x0d1117, 0.95)
            .setStrokeStyle(1, 0x4ac97f)
            .setOrigin(0.5, 1);
        
        const tooltipTitle = this.add.text(0, -50, '', {
            fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', fill: '#ffffff'
        }).setOrigin(0.5);

        const tooltipOwner = this.add.text(0, -30, '', {
            fontFamily: 'monospace', fontSize: '11px', fill: '#c9a227'
        }).setOrigin(0.5);

        this.tooltip.add([tooltipBg, tooltipTitle, tooltipOwner]);
        this.tooltipTitle = tooltipTitle;
        this.tooltipOwner = tooltipOwner;

        // Detail Panel
        this.detailPanel = this.add.container(550, 50).setDepth(200).setAlpha(0);
        const detailBg = this.add.rectangle(0, 0, 230, 300, 0x0d1117, 0.95).setOrigin(0, 0).setStrokeStyle(1, 0x4ac97f);
        this.detailText = this.add.text(15, 15, '', {
            fontFamily: 'sans-serif', fontSize: '12px', fill: '#ffffff', wordWrap: { width: 200 }
        });
        const closeBtn = this.add.text(210, 10, 'X', { fontFamily: 'sans-serif', fontSize: '14px', fill: '#ff4444' })
            .setInteractive()
            .on('pointerdown', () => this.detailPanel.setAlpha(0));
        this.detailPanel.add([detailBg, this.detailText, closeBtn]);

        // Render zones
        this.renderZones();

        this.game.events.on('TERRITORY_ZONE_CHANGED', (newZones) => {
            this.zonesData = newZones;
            this.assignGuildColors();
            this.renderZones();
            this.renderLegend();
        });
    }

    renderLegend() {
        this.legendContainer.removeAll(true);
        const legendBg = this.add.rectangle(0, 0, 250, 20 + Object.keys(this.guildColors).length * 20, 0x0d1117, 0.8).setOrigin(0, 0).setStrokeStyle(1, 0x4ac97f);
        this.legendContainer.add(legendBg);
        
        this.add.text(10, 10, 'LEGEND', { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', fill: '#ffffff' }, this.legendContainer);
        
        let y = 30;
        Object.entries(this.guildColors).forEach(([guildId, color]) => {
            const hexColor = '#' + color.toString(16).padStart(6, '0');
            const colorBox = this.add.rectangle(15, y + 6, 10, 10, color).setOrigin(0, 0);
            const label = this.add.text(35, y, `Guild ${guildId.substring(0,6)}`, { fontFamily: 'monospace', fontSize: '11px', fill: '#ffffff' });
            this.legendContainer.add([colorBox, label]);
            y += 20;
        });
    }

    renderZones() {
        this.zoneObjects.forEach(obj => obj.destroy());
        this.zoneObjects = [];

        this.zonesData.forEach(zone => {
            if (!zone.map_polygon) return;
            
            const isOwned = !!zone.owning_guild_id;
            const factionColor = this.getGuildColor(zone.owning_guild_id);
            const hoverColor = 0xffffff;
            const baseThickness = 2;

            const graphics = this.add.graphics();
            
            const drawPoly = (fillAlpha, currentLineThickness, currentLineColor) => {
                graphics.clear();
                graphics.lineStyle(currentLineThickness, currentLineColor, 0.9);
                graphics.fillStyle(factionColor, fillAlpha);
                
                graphics.beginPath();
                zone.map_polygon.forEach((pt, i) => {
                    if (i === 0) graphics.moveTo(pt[0], pt[1]);
                    else graphics.lineTo(pt[0], pt[1]);
                });
                graphics.closePath();
                graphics.fillPath();
                graphics.strokePath();
            };

            // Initial draw
            drawPoly(isOwned ? 0.4 : 0.1, baseThickness, factionColor);

            // Label
            const centerX = zone.map_polygon.reduce((sum, pt) => sum + pt[0], 0) / zone.map_polygon.length;
            const centerY = zone.map_polygon.reduce((sum, pt) => sum + pt[1], 0) / zone.map_polygon.length;
            
            const label = this.add.text(centerX, centerY, zone.name.toUpperCase(), {
                fontFamily: 'sans-serif', fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', letterSpacing: 1
            }).setOrigin(0.5).setAlpha(isOwned ? 1 : 0.6);

            // Interactive area
            const phaserPoly = new Phaser.Geom.Polygon(zone.map_polygon.map(pt => new Phaser.Math.Vector2(pt[0], pt[1])));
            const interactiveArea = this.add.polygon(0, 0, zone.map_polygon, 0x000000, 0).setOrigin(0, 0);
            interactiveArea.setInteractive(phaserPoly, Phaser.Geom.Polygon.Contains);
            
            interactiveArea.on('pointerover', (pointer) => {
                drawPoly(0.6, baseThickness + 2, hoverColor);
                
                // Tooltip
                this.tooltip.setPosition(pointer.x, pointer.y - 15);
                this.tooltipTitle.setText(zone.name);
                this.tooltipOwner.setText(isOwned ? 'OWNER: Guild ' + zone.owning_guild_id.substring(0,8) : 'STATUS: UNCLAIMED');
                this.tooltipOwner.setColor(isOwned ? '#' + factionColor.toString(16).padStart(6,'0') : '#8b949e');
                
                this.tweens.add({ targets: this.tooltip, alpha: 1, duration: 100, ease: 'Power2' });
            });

            interactiveArea.on('pointermove', (pointer) => {
                this.tooltip.setPosition(pointer.x, pointer.y - 15);
            });

            interactiveArea.on('pointerout', () => {
                drawPoly(isOwned ? 0.4 : 0.1, baseThickness, factionColor);
                this.tweens.add({ targets: this.tooltip, alpha: 0, duration: 100, ease: 'Power2' });
            });

            interactiveArea.on('pointerdown', () => {
                // Show detail panel
                let detailStr = `${zone.name.toUpperCase()}\n\n`;
                detailStr += `Owner: ${zone.owning_guild_id ? zone.owning_guild_id.substring(0,8) : 'None'}\n\n`;
                
                detailStr += `TOPIC AFFINITY:\n`;
                if (zone.topic_affinity) {
                    Object.entries(zone.topic_affinity).forEach(([topic, weight]) => {
                        detailStr += `- ${topic}: ${weight}\n`;
                    });
                }
                
                detailStr += `\nGUILD CONTRIBUTIONS:\n`;
                if (zone.scores) {
                    let sortedScores = Object.entries(zone.scores).sort((a,b) => b[1] - a[1]);
                    sortedScores.forEach(([gid, score]) => {
                        detailStr += `- Guild ${gid.substring(0,4)}: ${Math.floor(score)}\n`;
                    });
                }
                
                this.detailText.setText(detailStr);
                this.detailPanel.setAlpha(1);
            });

            this.zoneObjects.push(graphics, label, interactiveArea);
        });
    }
}
