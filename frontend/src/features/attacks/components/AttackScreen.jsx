import React, { useState } from 'react';

export default function AttackScreen({ candidates = [], cooldown, onLaunchAttack }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [activeAttack, setActiveAttack] = useState(null);

  const handleSelect = (target) => {
    setSelectedTarget(target);
  };

  const handleLaunch = (target) => {
    if (onLaunchAttack) {
      onLaunchAttack(target);
    }
    setActiveAttack({
      id: `atk-${Date.now()}`,
      target: target,
      curatedProblems: [
        { id: 1, title: `Curated: ${target.weakest_topics?.[0] || 'Algorithms'} Weakness`, topic: target.weakest_topics?.[0] || 'algorithms', status: 'Pending' },
        { id: 2, title: `Curated: ${target.weakest_topics?.[1] || 'Data Structures'} Challenge`, topic: target.weakest_topics?.[1] || 'data-structures', status: 'Pending' }
      ]
    });
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
      <h2 style={{ color: '#ef4444', marginTop: 0 }}>Async Village Attacks</h2>

      {cooldown && !cooldown.can_attack ? (
        <div style={{ padding: '16px', backgroundColor: '#451a03', color: '#fba518', borderRadius: '8px', marginBottom: '20px' }}>
          ⏳ <strong>On Cooldown:</strong> Attack available again in {cooldown.cooldown_minutes} minutes.
        </div>
      ) : (
        <div style={{ padding: '12px', backgroundColor: '#064e3b', color: '#34d399', borderRadius: '8px', marginBottom: '20px' }}>
          ⚔️ <strong>Ready for Attack!</strong> Select a target village below matched to your defense strength.
        </div>
      )}

      {activeAttack ? (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ color: '#38bdf8', marginTop: 0 }}>Attack in Progress vs {activeAttack.target.username}</h3>
          <p style={{ color: '#94a3b8' }}>Curated Problem Set targeting {activeAttack.target.username}'s weak topics:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeAttack.curatedProblems.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px' }}>
                <div>
                  <strong>{p.title}</strong>
                  <span style={{ marginLeft: '10px', fontSize: '12px', color: '#a855f7', textTransform: 'capitalize' }}>[{p.topic}]</span>
                </div>
                <button style={{ backgroundColor: '#10b981', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  Solve on Judge
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveAttack(null)}
            style={{ marginTop: '16px', backgroundColor: '#64748b', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
          >
            Finish Attack Session
          </button>
        </div>
      ) : (
        <div>
          <h3>Matchmaking Candidate Targets</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {candidates.length > 0 ? candidates.map(c => (
              <div
                key={c.user_id}
                onClick={() => handleSelect(c)}
                style={{
                  backgroundColor: selectedTarget?.user_id === c.user_id ? '#1e3a8a' : '#1e293b',
                  border: selectedTarget?.user_id === c.user_id ? '2px solid #3b82f6' : '1px solid #334155',
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <h4 style={{ margin: '0 0 8px 0', color: '#e2e8f0' }}>{c.username}</h4>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Defense Rating: <strong style={{ color: '#a855f7' }}>{c.defense_rating}</strong></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  Weak Topics: {c.weakest_topics?.join(', ') || 'algorithms'}
                </div>
                <button
                  disabled={cooldown && !cooldown.can_attack}
                  onClick={(e) => { e.stopPropagation(); handleLaunch(c); }}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    backgroundColor: cooldown && !cooldown.can_attack ? '#475569' : '#dc2626',
                    color: '#fff',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    cursor: cooldown && !cooldown.can_attack ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Launch Attack
                </button>
              </div>
            )) : (
              <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>No candidate targets found. Try refreshing matchmaking.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
