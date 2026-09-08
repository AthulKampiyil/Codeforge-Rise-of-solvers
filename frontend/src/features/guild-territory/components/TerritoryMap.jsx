import React, { useState } from 'react';

export default function TerritoryMap({ zones = [], joinRequests = [], isLeaderOrOfficer = false, onApproveRequest, onRejectRequest }) {
  const [showModal, setShowModal] = useState(false);

  const defaultZones = zones.length > 0 ? zones : [
    { id: 'z1', zone_name: 'Northmere Capital', owning_guild_id: 'g1', description: 'Algorithms & Data Structures Zone' },
    { id: 'z2', zone_name: 'Frozen Archives', owning_guild_id: null, description: 'Dynamic Programming Zone' },
    { id: 'z3', zone_name: 'Coastal Grounds', owning_guild_id: 'g2', description: 'Greedy & Math Zone' },
    { id: 'z4', zone_name: 'The Nexus', owning_guild_id: 'g1', description: 'Contested High-Affinity Zone' }
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#10b981' }}>Shared Territory Control Map</h2>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Guild practice scores contest zone control with 5% hysteresis margin.
          </p>
        </div>
        {isLeaderOrOfficer && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#8b5cf6',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Pending Join Requests ({joinRequests.length})
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {defaultZones.map(z => (
          <div key={z.id} style={{ backgroundColor: '#1e293b', padding: '18px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#38bdf8' }}>{z.zone_name}</h3>
              <span style={{
                backgroundColor: z.owning_guild_id ? '#065f46' : '#334155',
                color: z.owning_guild_id ? '#34d399' : '#94a3b8',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {z.owning_guild_id ? 'Controlled' : 'Unclaimed'}
              </span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '8px 0 0 0' }}>{z.description}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', width: '420px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc' }}>Guild Join Requests</h3>
            {joinRequests.length > 0 ? joinRequests.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>User ID: {r.user_id?.slice(0, 8)}...</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Status: {r.status}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onApproveRequest && onApproveRequest(r.id)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Approve
                  </button>
                  <button onClick={() => onRejectRequest && onRejectRequest(r.id)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <p style={{ color: '#94a3b8' }}>No pending join requests.</p>
            )}
            <button onClick={() => setShowModal(false)} style={{ marginTop: '16px', width: '100%', padding: '10px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
