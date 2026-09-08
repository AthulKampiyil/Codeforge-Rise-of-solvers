import React, { useState } from 'react';
import VillageDashboard from './features/village/components/VillageDashboard';
import AttackScreen from './features/attacks/components/AttackScreen';
import TerritoryMap from './features/guild-territory/components/TerritoryMap';
import WarRoomView from './features/war-room/components/WarRoomView';

export default function App() {
  const [activeTab, setActiveTab] = useState('village');
  const [syncStatus, setSyncStatus] = useState('Up to date');

  // Simulated state for Sprint 2 features
  const [userProfile, setUserProfile] = useState({
    username: 'CodeSolver_7',
    tier: 'Gold',
    trophy_count: 345,
    defense_rating: 412,
    guild: 'Binary Wolves (Leader)'
  });

  const [judgeAccounts, setJudgeAccounts] = useState([
    { id: '1', judge_name: 'codeforces', handle: 'tourist_fan', verified: true },
    { id: '2', judge_name: 'leetcode', handle: 'solver_99', verified: true },
    { id: '3', judge_name: 'codechef', handle: 'chef_alex', verified: false, token: 'TOKEN-9921' }
  ]);

  const [joinRequests, setJoinRequests] = useState([
    { id: 'req-1', user_id: '8a71f009-1234-4567-89ab-cdef01234567', status: 'pending' },
    { id: 'req-2', user_id: '3b92e111-9876-5432-10fe-dcba98765432', status: 'pending' }
  ]);

  const [cooldown, setCooldown] = useState({
    can_attack: true,
    cooldown_minutes: 30
  });

  const candidateTargets = [
    { user_id: 'u-101', username: 'null_terminator', defense_rating: 398, weakest_topics: ['dynamic-programming', 'graphs'] },
    { user_id: 'u-102', username: 'stack_overflow', defense_rating: 412, weakest_topics: ['greedy', 'math'] },
    { user_id: 'u-103', username: 'binary_wolves_alt', defense_rating: 405, weakest_topics: ['trees', 'arrays'] }
  ];

  const handleSyncRefresh = () => {
    setSyncStatus('Syncing...');
    setTimeout(() => {
      setSyncStatus('Up to date');
    }, 1500);
  };

  const handleApproveRequest = (reqId) => {
    setJoinRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleRejectRequest = (reqId) => {
    setJoinRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleLinkJudge = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const judge = formData.get('judge');
    const handle = formData.get('handle');
    if (!handle) return;
    setJudgeAccounts(prev => [
      ...prev.filter(j => j.judge_name !== judge),
      { id: `j-${Date.now()}`, judge_name: judge, handle: handle, verified: false, token: `CF-${Math.floor(Math.random()*10000)}` }
    ]);
    e.target.reset();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '14px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
          }}>
            ⚡
          </div>
          <div>
            <h1 style={{ fontSize: '20px', margin: 0, background: 'linear-gradient(90deg, #38bdf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CodeForge: Rise of Solvers
            </h1>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" /> WebSocket Connected | Sync: {syncStatus}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '6px', background: 'rgba(30, 41, 59, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {[
            { id: 'village', label: '🏘️ Code Village' },
            { id: 'attacks', label: '⚔️ Async Attacks' },
            { id: 'territory', label: '🗺️ Territory Map' },
            { id: 'war-room', label: '🏰 War Room' },
            { id: 'league', label: '🏆 League Standings' },
            { id: 'judges', label: '🔗 Judge Accounts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Profile Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc' }}>{userProfile.username}</div>
            <div style={{ fontSize: '12px', color: '#c084fc' }}>Tier: <strong>{userProfile.tier}</strong> ({userProfile.trophy_count} Trophies)</div>
          </div>
          <div className="badge badge-purple" style={{ padding: '8px 12px', fontSize: '13px' }}>
            🏆 {userProfile.trophy_count}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '28px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'village' && (
          <VillageDashboard
            villageData={{ defense_rating: userProfile.defense_rating }}
            onSyncTrigger={handleSyncRefresh}
          />
        )}

        {activeTab === 'attacks' && (
          <AttackScreen
            candidates={candidateTargets}
            cooldown={cooldown}
            onLaunchAttack={(target) => console.log('Launched attack against', target)}
          />
        )}

        {activeTab === 'territory' && (
          <TerritoryMap
            isLeaderOrOfficer={true}
            joinRequests={joinRequests}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
          />
        )}

        {activeTab === 'war-room' && (
          <WarRoomView />
        )}

        {activeTab === 'league' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ color: '#fbbf24', marginTop: 0 }}>🏆 League & Trophy Standings</h2>
            <p style={{ color: '#94a3b8' }}>Six-tier Elo-style progression system (Bronze through Legend).</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', margin: '20px 0' }}>
              {[
                { name: 'Bronze', pts: '0 - 100', active: false },
                { name: 'Silver', pts: '100 - 250', active: false },
                { name: 'Gold', pts: '250 - 500', active: true },
                { name: 'Platinum', pts: '500 - 1000', active: false },
                { name: 'Diamond', pts: '1000 - 2000', active: false },
                { name: 'Legend', pts: '2000+', active: false }
              ].map(tier => (
                <div
                  key={tier.name}
                  style={{
                    backgroundColor: tier.active ? '#451a03' : '#1e293b',
                    border: tier.active ? '2px solid #f59e0b' : '1px solid #334155',
                    padding: '14px',
                    borderRadius: '10px',
                    textAlign: 'center'
                  }}
                >
                  <h4 style={{ color: tier.active ? '#fbbf24' : '#e2e8f0', margin: '0 0 4px 0' }}>{tier.name}</h4>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{tier.pts} pts</div>
                  {tier.active && <span className="badge badge-amber" style={{ marginTop: '8px' }}>Your Tier</span>}
                </div>
              ))}
            </div>

            <h3>Global Solver Leaderboard</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '10px' }}>Rank</th>
                  <th>Solver</th>
                  <th>Guild</th>
                  <th>Tier</th>
                  <th>Trophies</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rank: 1, name: 'tourist_fan', guild: 'Binary Wolves', tier: 'Legend', trophies: 2450 },
                  { rank: 2, name: 'CodeSolver_7', guild: 'Binary Wolves', tier: 'Gold', trophies: 345 },
                  { rank: 3, name: 'null_terminator', guild: 'Stack Overflow', tier: 'Gold', trophies: 310 }
                ].map(r => (
                  <tr key={r.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>#{r.rank}</td>
                    <td style={{ color: '#38bdf8' }}>{r.name}</td>
                    <td style={{ color: '#94a3b8' }}>{r.guild}</td>
                    <td><span className="badge badge-purple">{r.tier}</span></td>
                    <td style={{ fontWeight: 'bold', color: '#fbbf24' }}>{r.trophies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'judges' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ color: '#38bdf8', marginTop: 0 }}>🔗 Linked Coding Judge Accounts</h2>
            <p style={{ color: '#94a3b8' }}>Link external judge profiles (Codeforces, LeetCode, CodeChef) to automatically track solved problems and level up your Code Village.</p>

            <form onSubmit={handleLinkJudge} style={{ display: 'flex', gap: '12px', margin: '20px 0', backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px' }}>
              <select name="judge" style={{ backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '10px', borderRadius: '6px' }}>
                <option value="codeforces">Codeforces</option>
                <option value="leetcode">LeetCode</option>
                <option value="codechef">CodeChef</option>
              </select>
              <input
                type="text"
                name="handle"
                placeholder="Enter handle/username..."
                style={{ flex: 1, backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '10px', borderRadius: '6px' }}
              />
              <button type="submit" className="btn-primary">Link Judge Profile</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {judgeAccounts.map(j => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', textTransform: 'capitalize', color: '#e2e8f0' }}>{j.judge_name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>Handle: {j.handle}</div>
                    {j.token && <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '4px' }}>One-time Proof Token: <code>{j.token}</code></div>}
                  </div>
                  <div>
                    {j.verified ? (
                      <span className="badge badge-emerald">Verified</span>
                    ) : (
                      <span className="badge badge-amber">Verification Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
