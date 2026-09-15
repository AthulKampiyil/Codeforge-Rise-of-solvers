import React from 'react';
import Phaser from 'phaser';
import WarMapScene from '../../../game/WarMapScene';

function WarMapCanvas() {
    React.useEffect(() => {
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'phaser-container',
            scene: [WarMapScene],
            transparent: true,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };
        const game = new Phaser.Game(config);

        game.events.once('step', () => {
            const scene = game.scene.getScene('WarMapScene');
            if (scene) {
                scene.updateZones([
                    { name: "Northmere Capital", owning_guild_id: "Guild_Spade", map_polygon: [[100, 100], [200, 100], [200, 200], [100, 200]], influence: 100 },
                    { name: "Frozen Archives", owning_guild_id: "Guild_Heart", map_polygon: [[200, 100], [300, 100], [300, 200], [200, 200]], influence: 45 },
                    { name: "Iron Peaks", owning_guild_id: "Guild_Diamond", map_polygon: [[300, 100], [400, 100], [400, 200], [300, 200]], influence: 75 },
                    { name: "Thornvale", owning_guild_id: "123", map_polygon: [[100, 200], [200, 200], [200, 300], [100, 300]], influence: 15 },
                    { name: "The Nexus", owning_guild_id: null, map_polygon: [[200, 200], [300, 200], [300, 300], [200, 300]], influence: 0 },
                    { name: "Rivergate", owning_guild_id: "123", map_polygon: [[300, 200], [400, 200], [400, 300], [300, 300]], influence: 20 },
                    { name: "Sunken Library", owning_guild_id: null, map_polygon: [[100, 300], [200, 300], [200, 400], [100, 400]], influence: 0 },
                    { name: "Codewall", owning_guild_id: "Guild_Diamond", map_polygon: [[200, 300], [400, 300], [400, 400], [200, 400]], influence: 10 },
                ]);
            }
        });

        return () => {
            game.destroy(true);
        };
    }, []);

    return <div id="phaser-container" style={{width: '100%', height: '100%'}}></div>;
}

export default function WarMap() {
    return (

        <div style={{flex: '1', display: 'flex', gap: '16px', padding: '18px 22px', minHeight: '0'}}>

    <div className="panel" style={{flex: '1', minWidth: '0'}}>
      <div className="panel-h">
        <div className="panel-t">Territory Control</div>
        <span className="dim mono" style={{fontSize: '10.5px'}}>canvas · WarMapScene.js · re-tints on TERRITORY_ZONE_CHANGED</span>
        <div style={{marginLeft: 'auto', display: 'flex', gap: '6px'}}>
          <div className="pill">Owner</div><div className="pill">Affinity heat</div><div className="pill">Contested only</div>
        </div>
      </div>

      <div style={{flex: '1', position: 'relative', background: '#0b0f15', overflow: 'hidden'}}>
        <WarMapCanvas />

        {/* legend: owner is never colour alone (SADD 8.1) */}
        <div className="panel" style={{position: 'absolute', left: '16px', bottom: '16px', background: 'rgba(20,26,34,.97)'}}>
          <div className="panel-b" style={{padding: '11px 13px', gap: '7px'}}>
            <div className="kicker">Guilds</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span style={{width: '11px', height: '11px', border: '1.5px solid #c9a227', background: 'rgba(201,162,39,.15)', display: 'block'}}></span><span style={{fontSize: '11.5px'}}>Ironforge Union</span><span className="mono dim" style={{fontSize: '10.5px', marginLeft: 'auto'}}>2 zones</span></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span style={{width: '11px', height: '11px', border: '1.5px solid #4a90c9', background: 'rgba(74,144,201,.13)', display: 'block'}}></span><span style={{fontSize: '11.5px'}}>Nullbyte Syndicate</span><span className="mono dim" style={{fontSize: '10.5px', marginLeft: 'auto'}}>2 zones</span></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span style={{width: '11px', height: '11px', border: '1.5px solid #c94a4a', background: 'rgba(201,74,74,.13)', display: 'block'}}></span><span style={{fontSize: '11.5px'}}>Ironpeak Circle</span><span className="mono dim" style={{fontSize: '10.5px', marginLeft: 'auto'}}>2 zones</span></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span style={{width: '11px', height: '11px', border: '1.5px solid #4ac97f', background: 'rgba(74,201,127,.11)', display: 'block'}}></span><span style={{fontSize: '11.5px'}}>Verdant Order</span><span className="mono dim" style={{fontSize: '10.5px', marginLeft: 'auto'}}>1 zone</span></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span style={{width: '11px', height: '11px', border: '1.5px solid #5c6673', display: 'block'}}></span><span className="muted" style={{fontSize: '11.5px'}}>Unclaimed</span><span className="mono dim" style={{fontSize: '10.5px', marginLeft: 'auto'}}>1 zone</span></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px', borderTop: '1px solid #2a323d'}}><span style={{width: '11px', height: '11px', border: '1.5px dashed #8b96a5', display: 'block'}}></span><span className="muted" style={{fontSize: '11.5px'}}>Contested (within 20%)</span></div>
          </div>
        </div>
      </div>
    </div>

    <div className="col" style={{width: '340px', flex: '0 0 340px'}}>
      <div className="panel">
        <div className="panel-h">
          <div className="panel-t">The Nexus</div>
          <span className="pill" style={{marginLeft: 'auto', borderColor: 'rgba(201,74,74,.45)', color: '#c94a4a'}}>contested</span>
        </div>
        <div className="panel-b" style={{gap: '12px'}}>
          <div>
            <div className="kicker" style={{marginBottom: '7px'}}>Topic affinity</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="muted" style={{width: '74px', fontSize: '11.5px'}}>Graphs</span><div className="bar" style={{flex: '1'}}><i style={{width: '100%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>0.30</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="muted" style={{width: '74px', fontSize: '11.5px'}}>DP</span><div className="bar" style={{flex: '1'}}><i style={{width: '87%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>0.26</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="muted" style={{width: '74px', fontSize: '11.5px'}}>Math</span><div className="bar" style={{flex: '1'}}><i style={{width: '73%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>0.22</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="muted" style={{width: '74px', fontSize: '11.5px'}}>Data str.</span><div className="bar" style={{flex: '1'}}><i style={{width: '73%'}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>0.22</span></div>
            </div>
          </div>
          <div style={{height: '1px', background: '#2a323d'}}></div>
          <div>
            <div className="kicker" style={{marginBottom: '7px'}}>Guild scores</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '7px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="inf" style={{width: '118px', fontSize: '11.5px'}}>Nullbyte Syndicate</span><div className="bar" style={{flex: '1'}}><i style={{width: '100%', background: '#4a90c9'}}></i></div><span className="mono" style={{fontSize: '11px'}}>3180</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="gold" style={{width: '118px', fontSize: '11.5px'}}>Ironforge Union</span><div className="bar" style={{flex: '1'}}><i style={{width: '86%'}}></i></div><span className="mono" style={{fontSize: '11px'}}>2744</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="bad" style={{width: '118px', fontSize: '11.5px'}}>Ironpeak Circle</span><div className="bar" style={{flex: '1'}}><i style={{width: '41%', background: '#c94a4a'}}></i></div><span className="mono" style={{fontSize: '11px'}}>1302</span></div>
            </div>
          </div>
          <div style={{background: '#0f151d', border: '1px solid #2a323d', borderRadius: '4px', padding: '10px 12px'}}>
            <div className="dim" style={{fontSize: '11px', lineHeight: '1.55'}}>Ownership flips only when the leader clears the holder by <span className="mono gold">5%</span>. You need <span className="mono gold">+595</span> to take The Nexus &mdash; roughly 12 graph or DP levels across active members.</div>
          </div>
          <div className="btn btn-sm btn-ghost" style={{width: '100%'}}>Who feeds this zone &rsaquo;</div>
        </div>
      </div>

      <div className="panel" style={{flex: '1', minHeight: '0'}}>
        <div className="panel-h"><div className="panel-t">Territory feed</div><span className="dim mono" style={{marginLeft: 'auto', fontSize: '10px'}}>ws /ws/events</span></div>
        <div className="panel-b" style={{padding: '0'}}>
          <div style={{padding: '11px 14px', borderBottom: '1px solid rgba(42,50,61,.5)'}}>
            <div className="mono" style={{fontSize: '9.5px', letterSpacing: '.1em', color: '#4a90c9'}}>TERRITORY_ZONE_CHANGED</div>
            <div style={{fontSize: '12px', marginTop: '3px'}}>Rivergate &rarr; <span className="gold">Ironforge Union</span></div>
            <div className="dim mono" style={{fontSize: '10px'}}>from Ironpeak Circle · 14 min ago</div>
          </div>
          <div style={{padding: '11px 14px', borderBottom: '1px solid rgba(42,50,61,.5)'}}>
            <div className="mono" style={{fontSize: '9.5px', letterSpacing: '.1em', color: '#5c6673'}}>SWEEP</div>
            <div style={{fontSize: '12px', marginTop: '3px'}} className="muted">Hourly reconciliation completed</div>
            <div className="dim mono" style={{fontSize: '10px'}}>8 zones recomputed · 1 flip · 41 min ago</div>
          </div>
          <div style={{padding: '11px 14px'}}>
            <div className="mono" style={{fontSize: '9.5px', letterSpacing: '.1em', color: '#4a90c9'}}>TERRITORY_ZONE_CHANGED</div>
            <div style={{fontSize: '12px', marginTop: '3px'}}>The Nexus &rarr; <span className="inf">Nullbyte Syndicate</span></div>
            <div className="dim mono" style={{fontSize: '10px'}}>from Ironforge Union · 6 h ago</div>
          </div>
        </div>
      </div>
    </div>
  </div>

    );
}
