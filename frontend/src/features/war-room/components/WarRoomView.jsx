import React from 'react';

export default function WarRoomView({ warRoomData }) {
  const members = warRoomData?.members || [
    { user_id: 'm1', username: 'SolvMaster', role: 'leader', defense_rating: 450, topics: [{ topic_name: 'algorithms', level: 5 }] },
    { user_id: 'm2', username: 'AlgoNinja', role: 'officer', defense_rating: 380, topics: [{ topic_name: 'data-structures', level: 4 }] },
    { user_id: 'm3', username: 'CodeWizard', role: 'member', defense_rating: 290, topics: [{ topic_name: 'dynamic-programming', level: 3 }] }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#a855f7' }}>🏰 Guild War Room</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Leader & Officer planning view for member topic strengths and territory strategy.
          </p>
        </div>
        <div style={{ backgroundColor: '#581c87', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
          Leader/Officer Access Granted
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {members.map(m => (
          <div key={m.user_id} style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#38bdf8' }}>
                {m.username} <span style={{ fontSize: '12px', color: '#a855f7', textTransform: 'capitalize' }}>[{m.role}]</span>
              </h3>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                Defense Rating: <strong style={{ color: '#fbbf24' }}>{m.defense_rating}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {m.topics?.map(t => (
                <span key={t.topic_name} style={{ backgroundColor: '#0284c7', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                  {t.topic_name}: Lvl {t.level}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
