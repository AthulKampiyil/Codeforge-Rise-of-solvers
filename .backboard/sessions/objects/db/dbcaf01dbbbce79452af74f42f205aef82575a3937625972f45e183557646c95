import React, { useState, useEffect, useMemo, useRef } from 'react';
import Phaser from 'phaser';
import WarMapScene from '../../../game/WarMapScene';
import { useTerritoryZones, useAllGuilds } from '../../guild-territory/hooks/useGuild.js';
import { useRealtimeEvent } from '../../../shared/websocket/client.js';

// SADD 7.3.1.2 / game_balance_config "territory.hysteresis_margin" — the
// leader has to clear the incumbent by this much before ownership flips.
// A zone within that margin of flipping is what "contested" means here;
// the backend doesn't compute or send an is_contested flag today.
const HYSTERESIS_MARGIN = 0.05;

const GUILD_COLOR_PALETTE = ['#4a90c9', '#c9a227', '#c94a4a', '#4ac97f', '#8b5cf6', '#f59e0b', '#ec4899'];

function assignGuildColors(zones) {
  const colors = {};
  let next = 0;
  (zones || []).forEach((z) => {
    if (z.owning_guild_id && !colors[z.owning_guild_id]) {
      colors[z.owning_guild_id] = GUILD_COLOR_PALETTE[next % GUILD_COLOR_PALETTE.length];
      next++;
    }
  });
  return colors;
}

function computeContested(zone) {
  const entries = Object.entries(zone.scores || {}).map(([id, score]) => ({ id, score: Number(score) || 0 }));
  if (entries.length === 0) return false;
  entries.sort((a, b) => b.score - a.score);
  const [top, second] = entries;
  if (top.score <= 0) return false;
  if (!zone.owning_guild_id) return true; // unclaimed but someone has a foothold
  if (top.id !== zone.owning_guild_id) return true; // challenger is ahead
  if (!second) return false;
  return (top.score - second.score) / top.score < HYSTERESIS_MARGIN;
}

function formatTopicLabel(key) {
  return key.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function timeAgo(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ago`;
}

function WarMapCanvas({ zones, mapMode, contestedOnly, filteredGuild, onZoneClick }) {
    const gameRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const zonesRef = useRef(zones);
    zonesRef.current = zones;

    useEffect(() => {
        // Belt-and-suspenders against React 18 StrictMode's dev-only double
        // invoke of mount effects: if the previous Phaser instance's
        // `destroy()` teardown (from this same effect's cleanup) hasn't
        // finished removing its <canvas> from the DOM by the time this runs
        // again, two canvases stack in the container — one visible, one
        // pushed below it — and Phaser's own hit-testing coordinate
        // transform ends up keyed off whichever one it thinks is "the"
        // canvas, so clicks silently land nowhere. Clearing the container
        // first guarantees exactly one canvas exists no matter the timing.
        containerRef.current.innerHTML = '';

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: containerRef.current,
            scene: [WarMapScene],
            transparent: true,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };
        const game = new Phaser.Game(config);
        gameRef.current = game;

        game.events.once('step', () => {
            // The container's final layout size can still be settling (fonts,
            // the async-loaded legend/side panel) after Phaser.Game() already
            // measured `containerRef.current` once at construction time — a
            // stale ScaleManager size doesn't affect what's drawn (FIT rescales
            // the canvas visually) but does throw off the screen-to-game-space
            // transform Phaser uses for hit testing, so pointer events land on
            // the wrong polygon. Forcing a refresh once layout has settled
            // re-measures the real parent size and fixes that transform.
            game.scale.refresh();
            const scene = game.scene.getScene('WarMapScene');
            if (scene) scene.updateZones(zonesRef.current);
        });

        game.events.on('ZONE_CLICKED', (zone) => {
            if (onZoneClick) onZoneClick(zone);
        });

        const handleWindowResize = () => game.scale.refresh();
        window.addEventListener('resize', handleWindowResize);

        return () => {
            window.removeEventListener('resize', handleWindowResize);
            game.destroy(true);
            gameRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const scene = gameRef.current?.scene.getScene('WarMapScene');
        if (scene?.updateZones) scene.updateZones(zones);
        gameRef.current?.scale.refresh();
    }, [zones]);

    useEffect(() => {
        const scene = gameRef.current?.scene.getScene('WarMapScene');
        if (scene?.setDisplayMode) scene.setDisplayMode(mapMode, contestedOnly, filteredGuild);
    }, [mapMode, contestedOnly, filteredGuild]);

    return <div ref={containerRef} style={{width: '100%', height: '100%'}}></div>;
}

export default function WarMap() {
    const { data: rawZones, isLoading } = useTerritoryZones();
    const { data: guilds } = useAllGuilds();
    const [mapMode, setMapMode] = useState('owner');
    const [contestedOnly, setContestedOnly] = useState(false);
    const [filteredGuild, setFilteredGuild] = useState(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [feed, setFeed] = useState([]);

    const guildNameById = useMemo(() => {
        const map = {};
        (guilds || []).forEach((g) => { map[g.id] = g.name; });
        return map;
    }, [guilds]);

    const zones = useMemo(() => (rawZones || []).map((z) => {
        const decorated = { ...z, owning_guild_name: z.owning_guild_id ? (guildNameById[z.owning_guild_id] || `Guild ${z.owning_guild_id.slice(0, 8)}`) : null };
        decorated.is_contested = computeContested(decorated);
        return decorated;
    }), [rawZones, guildNameById]);

    const guildColors = useMemo(() => assignGuildColors(zones), [zones]);

    const guildZoneCounts = useMemo(() => {
        const counts = {};
        let unclaimed = 0;
        zones.forEach((z) => {
            if (z.owning_guild_id) counts[z.owning_guild_id] = (counts[z.owning_guild_id] || 0) + 1;
            else unclaimed++;
        });
        return { counts, unclaimed };
    }, [zones]);

    useEffect(() => {
        if (!selectedZone && zones.length > 0) {
            setSelectedZone(zones.find((z) => z.is_contested) || zones[0]);
        }
    }, [zones, selectedZone]);

    useRealtimeEvent('TERRITORY_ZONE_CHANGED', (msg) => {
        const payload = msg.payload || msg;
        setFeed((current) => [{
            id: msg.event_id || `${Date.now()}-${current.length}`,
            zoneName: payload.zone_name,
            fromName: payload.previous_owner_guild_id ? (guildNameById[payload.previous_owner_guild_id] || 'a rival guild') : 'Unclaimed',
            toName: payload.new_owner_guild_id ? (guildNameById[payload.new_owner_guild_id] || 'a guild') : 'Unclaimed',
            at: new Date(),
        }, ...current].slice(0, 8));
    });

    const selected = selectedZone && zones.find((z) => z.id === selectedZone.id) || selectedZone;

    return (
  <div style={{height: '100%', display: 'flex', gap: '16px', padding: '18px 22px', minHeight: '0'}}>

    <div className="panel" style={{flex: '1', minWidth: '0', minHeight: '0'}}>
      <div className="panel-h">
        <div className="panel-t">Territory Control</div>
        <span className="dim mono" style={{fontSize: '10.5px'}}>{isLoading ? 'loading zones…' : `${zones.length} zones · live`}</span>
        <div style={{marginLeft: 'auto', display: 'flex', gap: '6px'}}>
          <div className="pill" style={{cursor: 'pointer', background: mapMode === 'owner' ? 'rgba(255,255,255,0.1)' : ''}} onClick={() => setMapMode('owner')}>Owner</div>
          <div className="pill" style={{cursor: 'pointer', background: mapMode === 'affinity' ? 'rgba(255,255,255,0.1)' : ''}} onClick={() => setMapMode('affinity')}>Affinity heat</div>
          <div className="pill" style={{cursor: 'pointer', background: contestedOnly ? 'rgba(255,255,255,0.1)' : ''}} onClick={() => setContestedOnly(!contestedOnly)}>Contested only</div>
        </div>
      </div>

      <div style={{flex: '1', minHeight: '0', position: 'relative', background: '#0b0f15', overflow: 'hidden'}}>
        <WarMapCanvas zones={zones} mapMode={mapMode} contestedOnly={contestedOnly} filteredGuild={filteredGuild} onZoneClick={setSelectedZone} />

        {/* legend: owner is never colour alone (SADD 8.1) */}
        <div className="panel" style={{position: 'absolute', left: '16px', bottom: '16px', background: 'rgba(20,26,34,.97)'}}>
          <div className="panel-b" style={{padding: '11px 13px', gap: '7px'}}>
            <div className="kicker">Guilds</div>
            {Object.keys(guildColors).length === 0 && guildZoneCounts.unclaimed === 0 && (
              <div className="dim mono" style={{fontSize: '11px'}}>No zones yet</div>
            )}
            {Object.entries(guildColors).map(([guildId, color]) => (
              <div
                key={guildId}
                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: filteredGuild && filteredGuild !== guildId ? 0.3 : 1}}
                onClick={() => setFilteredGuild(filteredGuild === guildId ? null : guildId)}
              >
                <span style={{width: '11px', height: '11px', border: `1.5px solid ${color}`, background: `${color}22`, display: 'block'}}></span>
                <span style={{fontSize: '11.5px'}}>{guildNameById[guildId] || `Guild ${guildId.slice(0, 8)}`}</span>
                <span className="mono dim" style={{fontSize: '10.5px', marginLeft: 'auto'}}>{guildZoneCounts.counts[guildId] || 0} zone{guildZoneCounts.counts[guildId] === 1 ? '' : 's'}</span>
              </div>
            ))}
            {guildZoneCounts.unclaimed > 0 && (
              <div
                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: filteredGuild && filteredGuild !== 'unclaimed' ? 0.3 : 1}}
                onClick={() => setFilteredGuild(filteredGuild === 'unclaimed' ? null : 'unclaimed')}
              >
                <span style={{width: '11px', height: '11px', border: '1.5px solid #5c6673', display: 'block'}}></span>
                <span className="muted" style={{fontSize: '11.5px'}}>Unclaimed</span>
                <span className="mono dim" style={{fontSize: '10.5px', marginLeft: 'auto'}}>{guildZoneCounts.unclaimed} zone{guildZoneCounts.unclaimed === 1 ? '' : 's'}</span>
              </div>
            )}
            <div style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px', borderTop: '1px solid #2a323d', opacity: contestedOnly ? 1 : 0.6}} onClick={() => setContestedOnly(!contestedOnly)}><span style={{width: '11px', height: '11px', border: '1.5px dashed #8b96a5', display: 'block'}}></span><span className="muted" style={{fontSize: '11.5px'}}>Contested (within {Math.round(HYSTERESIS_MARGIN * 100)}%)</span></div>
          </div>
        </div>
      </div>
    </div>

    <div className="col" style={{width: '340px', flex: '0 0 340px'}}>
      <div className="panel">
        <div className="panel-h">
          <div className="panel-t">{selected?.name || (isLoading ? "Loading…" : "No Zone Selected")}</div>
          {selected?.is_contested && <span className="pill" style={{marginLeft: 'auto', borderColor: 'rgba(201,74,74,.45)', color: '#c94a4a'}}>contested</span>}
        </div>
        <div className="panel-b" style={{gap: '12px'}}>
          <div>
            <div className="kicker" style={{marginBottom: '7px'}}>Topic affinity</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
              {selected?.topic_affinity && Object.keys(selected.topic_affinity).length > 0 ? Object.entries(selected.topic_affinity).map(([topic, weight]) => (
                  <div key={topic} style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className="muted" style={{width: '84px', fontSize: '11.5px'}}>{formatTopicLabel(topic)}</span><div className="bar" style={{flex: '1'}}><i style={{width: `${Math.min(weight * 333, 100)}%`}}></i></div><span className="mono dim" style={{fontSize: '11px'}}>{weight.toFixed(2)}</span></div>
              )) : <div className="dim mono" style={{fontSize: '11px'}}>No affinity data</div>}
            </div>
          </div>
          <div style={{height: '1px', background: '#2a323d'}}></div>
          <div>
            <div className="kicker" style={{marginBottom: '7px'}}>Guild scores</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '7px'}}>
              {selected?.scores && Object.keys(selected.scores).length > 0 ? Object.entries(selected.scores).sort((a,b)=>b[1]-a[1]).map(([gid, score], idx) => {
                  const guildName = guildNameById[gid] || `Guild ${gid.slice(0, 8)}`;
                  let colorClass = idx === 0 ? "inf" : (idx === 1 ? "gold" : "bad");
                  let bgCol = guildColors[gid] || (idx === 0 ? "#4a90c9" : (idx === 1 ? "" : "#c94a4a"));
                  let maxScore = Math.max(...Object.values(selected.scores), 1);
                  return (
                      <div key={gid} style={{display: 'flex', alignItems: 'center', gap: '9px'}}><span className={colorClass} style={{width: '118px', fontSize: '11.5px'}}>{guildName}</span><div className="bar" style={{flex: '1'}}><i style={{width: `${(score/maxScore)*100}%`, background: bgCol}}></i></div><span className="mono" style={{fontSize: '11px'}}>{Math.floor(score)}</span></div>
                  );
              }) : <div className="dim mono" style={{fontSize: '11px'}}>No contributions yet</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{flex: '1', minHeight: '0'}}>
        <div className="panel-h"><div className="panel-t">Territory feed</div><span className="dim mono" style={{marginLeft: 'auto', fontSize: '10px'}}>ws /ws/events</span></div>
        <div className="panel-b" style={{padding: '0'}}>
          {feed.length === 0 ? (
            <div style={{padding: '18px 14px'}} className="dim mono">No territory changes yet this session — ownership flips push here live.</div>
          ) : feed.map((entry) => (
            <div key={entry.id} style={{padding: '11px 14px', borderBottom: '1px solid rgba(42,50,61,.5)'}}>
              <div className="mono" style={{fontSize: '9.5px', letterSpacing: '.1em', color: '#4a90c9'}}>TERRITORY_ZONE_CHANGED</div>
              <div style={{fontSize: '12px', marginTop: '3px'}}>{entry.zoneName} &rarr; <span className="gold">{entry.toName}</span></div>
              <div className="dim mono" style={{fontSize: '10px'}}>from {entry.fromName} &middot; {timeAgo(entry.at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

    );
}
