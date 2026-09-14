import Phaser from 'phaser';

export default class WarMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WarMapScene' });
        this.zones = [];
    }

    init(data) {
        this.zones = data.zones || [];
    }

    create() {
        this.cameras.main.setBackgroundColor('#0d1117');
        
        // SADD 8.1 Accessibility: keep the legend
        const legendText = this.add.text(20, this.scale.height - 40, 'Legend: Hover for details', {
            fontFamily: 'monospace', fontSize: '14px', fill: '#c9a227'
        }).setScrollFactor(0);

        this.drawZones();

        // Listen for React events via a custom event on the window or registry
        this.game.events.on('TERRITORY_ZONE_CHANGED', this.updateZones, this);
    }

    updateZones(newZones) {
        this.zones = newZones;
        this.drawZones();
    }

    drawZones() {
        this.children.removeAll();
        
        this.zones.forEach(zone => {
            if (!zone.map_polygon) return;
            
            const graphics = this.add.graphics();
            const color = this.getGuildColor(zone.owning_guild_id);
            graphics.lineStyle(2, 0x2a323d);
            graphics.fillStyle(color, 0.5);
            
            graphics.beginPath();
            zone.map_polygon.forEach((pt, i) => {
                if (i === 0) graphics.moveTo(pt[0], pt[1]);
                else graphics.lineTo(pt[0], pt[1]);
            });
            graphics.closePath();
            graphics.fillPath();
            graphics.strokePath();

            const phaserPoly = new Phaser.Geom.Polygon(zone.map_polygon.map(pt => new Phaser.Math.Vector2(pt[0], pt[1])));
            const interactiveArea = this.add.polygon(0, 0, zone.map_polygon, 0x000000, 0).setOrigin(0, 0);
            interactiveArea.setInteractive(phaserPoly, Phaser.Geom.Polygon.Contains);
            
            interactiveArea.on('pointerover', () => {
                graphics.clear();
                graphics.lineStyle(2, 0xffffff);
                graphics.fillStyle(color, 0.8);
                graphics.beginPath();
                zone.map_polygon.forEach((pt, i) => {
                    if (i === 0) graphics.moveTo(pt[0], pt[1]);
                    else graphics.lineTo(pt[0], pt[1]);
                });
                graphics.closePath();
                graphics.fillPath();
                graphics.strokePath();
                this.game.events.emit('ZONE_HOVER', zone);
            });

            interactiveArea.on('pointerout', () => {
                this.drawZones();
                this.game.events.emit('ZONE_HOVER_OUT');
            });

            interactiveArea.on('pointerdown', () => {
                this.game.events.emit('ZONE_CLICK', zone);
            });
            
            const centerX = zone.map_polygon.reduce((sum, pt) => sum + pt[0], 0) / zone.map_polygon.length;
            const centerY = zone.map_polygon.reduce((sum, pt) => sum + pt[1], 0) / zone.map_polygon.length;
            this.add.text(centerX, centerY, zone.name, {
                fontFamily: 'monospace', fontSize: '12px', fill: '#ffffff'
            }).setOrigin(0.5);
        });
    }

    getGuildColor(guildId) {
        if (!guildId) return 0x2a323d;
        return 0xc94a4a;
    }
}
