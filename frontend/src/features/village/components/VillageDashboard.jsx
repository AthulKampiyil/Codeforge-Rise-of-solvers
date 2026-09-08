import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

class VillageScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VillageScene' });
  }

  create() {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0f172a, 1);
    graphics.fillRect(0, 0, width, height);

    this.add.text(width / 2, 25, '⚡ CODE VILLAGE ⚡', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const structures = [
      { name: 'Algorithms', level: 3, x: width * 0.25, y: height * 0.45, color: 0x3b82f6 },
      { name: 'Data Structures', level: 2, x: width * 0.75, y: height * 0.45, color: 0x10b981 },
      { name: 'Dynamic Prog', level: 4, x: width * 0.25, y: height * 0.75, color: 0xf59e0b },
      { name: 'Greedy & Math', level: 1, x: width * 0.75, y: height * 0.75, color: 0xec4899 }
    ];

    structures.forEach(st => {
      const b = this.add.graphics();
      b.fillStyle(st.color, 0.85);
      b.fillRoundedRect(st.x - 60, st.y - 40, 120, 80, 10);
      b.lineStyle(2, 0xffffff, 0.6);
      b.strokeRoundedRect(st.x - 60, st.y - 40, 120, 80, 10);

      this.add.text(st.x, st.y - 10, st.name, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(st.x, st.y + 14, `Lvl ${st.level}`, {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        color: '#fbbf24',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    });
  }
}

export default function VillageDashboard({ villageData, onSyncTrigger }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [phaserLoaded, setPhaserLoaded] = useState(false);

  const topics = villageData?.topics || [
    { topic_name: 'algorithms', level: 3, progress_points: 45 },
    { topic_name: 'data-structures', level: 2, progress_points: 40 },
    { topic_name: 'dynamic-programming', level: 4, progress_points: 90 },
    { topic_name: 'greedy', level: 1, progress_points: 15 }
  ];
  const defenseRating = villageData?.defense_rating || 412;

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    try {
      const config = {
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: containerRef.current.clientWidth || 700,
        height: 340,
        transparent: true,
        scene: [VillageScene]
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
      setPhaserLoaded(true);
    } catch (err) {
      console.warn('Phaser initialization fallback:', err);
      setPhaserLoaded(false);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>Code Village Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Defense Rating: <strong style={{ color: '#a855f7' }}>{defenseRating}</strong>
          </p>
        </div>
        <button
          onClick={onSyncTrigger}
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          🔄 Refresh Sync
        </button>
      </div>

      <div ref={containerRef} style={{ width: '100%', minHeight: '340px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', backgroundColor: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!phaserLoaded && (
          <div style={{ width: '100%', height: '100%', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            {topics.map(t => (
              <div key={t.topic_name} style={{ backgroundColor: '#1e293b', border: '2px solid #38bdf8', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#38bdf8', textTransform: 'capitalize' }}>{t.topic_name.replace('-', ' ')}</h3>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24', marginTop: '8px' }}>Level {t.level}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{t.progress_points} Progress Points</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {topics.map(t => (
          <div key={t.topic_name} style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ margin: '0 0 6px 0', textTransform: 'capitalize', color: '#e2e8f0' }}>{t.topic_name.replace('-', ' ')}</h4>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Level: <strong style={{ color: '#fbbf24' }}>{t.level}</strong></div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Progress: {t.progress_points} pts</div>
          </div>
        ))}
      </div>
    </div>
  );
}
