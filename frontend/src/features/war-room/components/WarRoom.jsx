import React from 'react';
import { useParams } from 'react-router-dom';
import { useWarRoom } from '../hooks/useWarRoom';

const TOPIC_KEYS = ['arrays', 'strings', 'math', 'greedy', 'graphs', 'trees', 'dp', 'ds'];
const TOPIC_LABELS = {
  'arrays': 'Arr', 'strings': 'Str', 'math': 'Math', 'greedy': 'Grdy',
  'graphs': 'Grph', 'trees': 'Tree', 'dp': 'DP', 'ds': 'DS'
};

export default function WarRoom() {
  const { guildId } = useParams();
  const { data, loading, error } = useWarRoom(guildId);

  if (loading) return <div style={{padding: '20px'}}>Loading...</div>;
  if (error) return <div style={{padding: '20px', color: 'red'}}>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div style={{flex: '1', display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 22px', minHeight: '0'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: '14px'}}>
        <div>
          <div className="kicker">Guild war room · REQ-6.1 – 6.3 · Leader &amp; Officer only</div>
          <div className="sect-t" style={{marginTop: '3px'}}>Guild War Room — where to push</div>
        </div>
        <div style={{marginLeft: 'auto', display: 'flex', gap: '8px'}}>
          <div className="pill">Read-only view of M3 + M5</div>
          <div className="pill">Recomputed hourly</div>
        </div>
      </div>

      <div className="row" style={{flex: '0 0 auto', overflowX: 'auto'}}>
        {data.contested_zones.map(zone => (
          <div key={zone.id} className="panel" style={{flex: '1', minWidth: '250px'}}>
            <div className="panel-b" style={{padding: '12px 14px', gap: '7px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span className="disp" style={{fontSize: '15px'}}>{zone.name}</span>
                {zone.owner_guild_id === data.guildId ? 
                  <span className="pill" style={{borderColor: 'rgba(74,201,127,.45)', color: '#4ac97f'}}>Held</span> : 
                  <span className="pill" style={{borderColor: 'rgba(201,74,74,.45)', color: '#c94a4a'}}>Contested</span>
                }
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
                <span className="mono dim" style={{fontSize: '11px'}}>Scores: {Object.values(zone.scores).join(' / ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{height: '100%', display: 'flex', gap: '16px', minHeight: '0'}}>
        <div className="panel" style={{flex: '1', minWidth: '0', overflowY: 'auto'}}>
          <div className="panel-h">
            <div className="panel-t">Member &times; topic strength</div>
          </div>
          <div style={{overflow: 'auto'}}>
            <table className="wt" style={{width: '100%'}}>
              <thead>
                <tr>
                  <th>Member</th>
                  {TOPIC_KEYS.map(k => <th key={k} style={{textAlign: 'center'}}>{TOPIC_LABELS[k]}</th>)}
                  <th>Def Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map(m => {
                  const getLevel = (name) => {
                    const t = m.topics.find(t => t.name === name);
                    return t ? t.level : 0;
                  };
                  return (
                    <tr key={m.user_id}>
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <div className="avatar" style={{width: '24px', height: '24px', fontSize: '10px'}}>{m.username[0].toUpperCase()}</div>
                          <span style={{fontSize: '12.5px'}}>{m.username}</span>
                          {['leader', 'officer'].includes(m.role) && <span className="pill" style={{fontSize: '10px', padding: '1px 6px'}}>{m.role}</span>}
                        </div>
                      </td>
                      {TOPIC_KEYS.map(k => (
                        <td key={k} className="mono" style={{textAlign: 'center'}}>{getLevel(k)}</td>
                      ))}
                      <td>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <div className="bar" style={{width: '64px'}}><i style={{width: `${Math.min(100, m.defense_rating / 10)}%`}}></i></div>
                          <span className="mono dim" style={{fontSize: '11px'}}>{m.defense_rating}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="col" style={{width: '314px', flex: '0 0 314px'}}>
          <div className="panel">
            <div className="panel-h"><div className="panel-t">Where to push</div></div>
            <div className="panel-b" style={{gap: '11px'}}>
              <div className="dim" style={{fontSize: '11px', lineHeight: '1.55'}}>Dynamic push insights coming soon.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
