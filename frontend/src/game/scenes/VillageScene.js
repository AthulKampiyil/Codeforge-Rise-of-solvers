import Phaser from 'phaser';

export default class VillageScene extends Phaser.Scene {
  constructor() {
    super('VillageScene');
    this.topics = [];
    this.defenseRating = 100;
  }

  init(data) {
    if (data && data.topics) {
      this.topics = data.topics;
      this.defenseRating = data.defenseRating || 100;
    }
  }

  create() {
    const { width, height } = this.scale;

    // Background gradient canvas fill
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
    graphics.fillRect(0, 0, width, height);

    // Banner Text
    this.add.text(width / 2, 30, '⚡ CODE VILLAGE ⚡', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '22px',
      color: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, 58, `Defense Rating: ${this.defenseRating}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      color: '#a855f7'
    }).setOrigin(0.5);

    // Render topic village buildings
    const structures = [
      { name: 'Algorithms', key: 'algorithms', x: width * 0.25, y: height * 0.45, color: 0x3b82f6 },
      { name: 'Data Structures', key: 'data-structures', x: width * 0.75, y: height * 0.45, color: 0x10b981 },
      { name: 'Dynamic Prog', key: 'dynamic-programming', x: width * 0.25, y: height * 0.75, color: 0xf59e0b },
      { name: 'Greedy & Math', key: 'greedy', x: width * 0.75, y: height * 0.75, color: 0xec4899 }
    ];

    structures.forEach(st => {
      const topicData = this.topics.find(t => t.topic_name === st.key) || { level: 1, progress_points: 0 };
      const level = topicData.level || 1;

      // Draw building base structure
      const base = this.add.graphics();
      base.fillStyle(st.color, 0.85);
      const bWidth = 110 + level * 8;
      const bHeight = 80 + level * 10;
      base.fillRoundedRect(st.x - bWidth / 2, st.y - bHeight / 2, bWidth, bHeight, 10);
      base.lineStyle(2, 0xffffff, 0.6);
      base.strokeRoundedRect(st.x - bWidth / 2, st.y - bHeight / 2, bWidth, bHeight, 10);

      // Building Label & Level Badge
      this.add.text(st.x, st.y - 12, st.name, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(st.x, st.y + 14, `Level ${level}`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#fbbf24',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    });
  }

  updateVillageData(topics, defenseRating) {
    this.topics = topics;
    this.defenseRating = defenseRating;
    this.scene.restart({ topics, defenseRating });
  }
}
