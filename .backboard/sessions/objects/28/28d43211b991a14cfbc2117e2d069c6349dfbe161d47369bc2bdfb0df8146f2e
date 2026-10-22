import Phaser from 'phaser';

export default class WarMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WarMapScene' });
        this.zonesData = [];
        this.zoneObjects = {};
        this.guildColors = {}; // guild_id -> color hex
        this.colorPalette = [0x4a90c9, 0xc9a227, 0xc94a4a, 0x4ac97f, 0x8b5cf6, 0xf59e0b, 0xec4899];
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
    }

    setDisplayMode(mode, contestedOnly, filteredGuild = null) {
        this.mapMode = mode;
        this.contestedOnly = contestedOnly;
        this.filteredGuild = filteredGuild;
        this.renderZones();
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
        this.events.on('update', () => {
            if (this.input._pendingInsertion.length > 0) this.input.preUpdate();
        });

        this.cameras.main.setBackgroundColor('#05080c');

        for(let x = 0; x < 800; x += 40) {
            for(let y = 0; y < 600; y += 40) {
                this.add.circle(x, y, 1, 0x2a323d, 0.4);
            }
        }

        this.add.text(20, 20, 'GLOBAL STRATEGY MAP', {
            fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', fill: '#ffffff', letterSpacing: 2
        }).setAlpha(0.9);

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

        this.renderZones();

        this.events.once('shutdown', () => this.input.setDefaultCursor('default'));
    }

    renderZones() {
        this.zonesData.forEach(zone => {
            if (!zone.map_polygon) return;
            
            if (!this.zoneObjects[zone.id]) {
                const graphics = this.add.graphics();
                const phaserPoints = zone.map_polygon.map(pt => new Phaser.Math.Vector2(pt[0], pt[1]));
                const phaserPoly = new Phaser.Geom.Polygon(phaserPoints);
                
                const centerX = zone.map_polygon.reduce((sum, pt) => sum + pt[0], 0) / zone.map_polygon.length;
                const centerY = zone.map_polygon.reduce((sum, pt) => sum + pt[1], 0) / zone.map_polygon.length;
                
                const nameLabel = this.add.text(centerX, centerY - 6, zone.name.toUpperCase(), {
                    fontFamily: 'sans-serif', fontSize: '11px', fontStyle: 'bold', fill: '#ffffff', align: 'center', letterSpacing: 1
                }).setOrigin(0.5);

                const ownerLabel = this.add.text(centerX, centerY + 8, '', {
                    fontFamily: 'monospace', fontSize: '11px', align: 'center'
                }).setOrigin(0.5);
                
                this.zoneObjects[zone.id] = {
                    graphics,
                    nameLabel,
                    ownerLabel,
                    isHovered: false
                };
                
                graphics.on('pointerover', (pointer) => {
                    this.input.setDefaultCursor('pointer');
                    this.zoneObjects[zone.id].isHovered = true;
                    this.updateZoneVisuals(zone);

                    this.tooltip.setPosition(pointer.x, pointer.y - 15);
                    this.tooltipTitle.setText(zone.name);
                    const isOwned = !!zone.owning_guild_id;
                    const factionColor = this.getGuildColor(zone.owning_guild_id);
                    this.tooltipOwner.setText(isOwned ? 'OWNER: ' + (zone.owning_guild_name || zone.owning_guild_id.substring(0, 8)) : 'STATUS: UNCLAIMED');
                    this.tooltipOwner.setColor(isOwned ? '#' + factionColor.toString(16).padStart(6,'0') : '#8b949e');

                    this.tweens.killTweensOf(this.tooltip);
                    this.tweens.add({ targets: this.tooltip, alpha: 1, duration: 100, ease: 'Power2' });
                });

                graphics.on('pointermove', (pointer) => {
                    this.tooltip.setPosition(pointer.x, pointer.y - 15);
                });

                graphics.on('pointerout', () => {
                    this.input.setDefaultCursor('default');
                    this.zoneObjects[zone.id].isHovered = false;
                    this.updateZoneVisuals(zone);
                    
                    this.tweens.killTweensOf(this.tooltip);
                    this.tweens.add({ targets: this.tooltip, alpha: 0, duration: 100, ease: 'Power2' });
                });

                graphics.on('pointerdown', () => {
                    this.game.events.emit('ZONE_CLICKED', zone);
                });
            }
            
            this.updateZoneVisuals(zone);
        });
    }

    updateZoneVisuals(zone) {
        const obj = this.zoneObjects[zone.id];
        if (!obj) return;
        
        let isOwned = !!zone.owning_guild_id;
        let factionColor = this.getGuildColor(zone.owning_guild_id);
        let hoverColor = 0xffffff;
        let baseThickness = 2;

        const isFilteredOut = (this.filteredGuild && (
            (this.filteredGuild === 'unclaimed' && isOwned) || 
            (this.filteredGuild !== 'unclaimed' && zone.owning_guild_id !== this.filteredGuild)
        )) || (this.contestedOnly && !zone.is_contested);
        
        const phaserPoints = zone.map_polygon.map(pt => new Phaser.Math.Vector2(pt[0], pt[1]));
        const phaserPoly = new Phaser.Geom.Polygon(phaserPoints);
        
        if (isFilteredOut) {
            obj.graphics.disableInteractive();
        } else {
            obj.graphics.setInteractive(phaserPoly, Phaser.Geom.Polygon.Contains);
        }

        const { graphics, nameLabel, ownerLabel, isHovered } = obj;
        
        let fillAlpha = isHovered ? 0.6 : (isOwned ? 0.4 : 0.15);
        let currentLineThickness = isHovered ? baseThickness + 2 : baseThickness;
        let currentLineColor = isHovered ? hoverColor : factionColor;

        if (isFilteredOut) {
            fillAlpha = 0;
            currentLineThickness = 1;
            currentLineColor = 0x2a323d;
        }

        graphics.clear();

        if (this.mapMode === 'affinity' && !isFilteredOut) {
            const heatColors = [0x000000, 0xef4444, 0xf59e0b, 0x10b981];
            const affinityVal = zone.influence || 0;
            let heatColor = heatColors[0];
            if (affinityVal > 75) heatColor = heatColors[3];
            else if (affinityVal > 45) heatColor = heatColors[2];
            else if (affinityVal > 0) heatColor = heatColors[1];
            
            graphics.fillStyle(heatColor, fillAlpha === 0 ? 0 : 0.4);
        } else {
            graphics.fillStyle(isFilteredOut ? 0 : factionColor, fillAlpha);
        }
        
        graphics.beginPath();
        zone.map_polygon.forEach((pt, i) => {
            if (i === 0) graphics.moveTo(pt[0], pt[1]);
            else graphics.lineTo(pt[0], pt[1]);
        });
        graphics.closePath();
        graphics.fillPath();

        if (zone.is_contested && !isFilteredOut) {
            graphics.lineStyle(currentLineThickness, 0x8b96a5, 1);
            const polyPoints = zone.map_polygon;
            for (let i = 0; i < polyPoints.length; i++) {
                const p1 = new Phaser.Math.Vector2(polyPoints[i][0], polyPoints[i][1]);
                const p2 = new Phaser.Math.Vector2(polyPoints[(i + 1) % polyPoints.length][0], polyPoints[(i + 1) % polyPoints.length][1]);
                const dist = p1.distance(p2);
                const dashLen = 8;
                const gapLen = 8;
                const chunks = Math.floor(dist / (dashLen + gapLen));
                if (chunks > 0) {
                    const dx = (p2.x - p1.x) / dist;
                    const dy = (p2.y - p1.y) / dist;
                    let cx = p1.x;
                    let cy = p1.y;
                    for (let j = 0; j < chunks; j++) {
                        graphics.beginPath();
                        graphics.moveTo(cx, cy);
                        graphics.lineTo(cx + dx * dashLen, cy + dy * dashLen);
                        graphics.strokePath();
                        cx += dx * (dashLen + gapLen);
                        cy += dy * (dashLen + gapLen);
                    }
                } else {
                    graphics.beginPath();
                    graphics.moveTo(p1.x, p1.y);
                    graphics.lineTo(p2.x, p2.y);
                    graphics.strokePath();
                }
            }
        } else {
            graphics.lineStyle(currentLineThickness, currentLineColor, 0.9);
            graphics.beginPath();
            zone.map_polygon.forEach((pt, i) => {
                if (i === 0) graphics.moveTo(pt[0], pt[1]);
                else graphics.lineTo(pt[0], pt[1]);
            });
            graphics.closePath();
            graphics.strokePath();
        }

        nameLabel.setAlpha(isFilteredOut ? 0.2 : (isOwned ? 1 : 0.6));
        
        const ownerName = zone.owning_guild_name || (isOwned ? zone.owning_guild_id.slice(0, 8) : null);
        const ownerText = isOwned ? (ownerName + (zone.is_contested ? ' (contested)' : '')) : 'unclaimed';
        ownerLabel.setText(ownerText);
        ownerLabel.setColor(isOwned ? '#' + factionColor.toString(16).padStart(6,'0') : '#8b949e');
        ownerLabel.setAlpha(isFilteredOut ? 0.2 : (isOwned ? 1 : 0.6));
    }
}
