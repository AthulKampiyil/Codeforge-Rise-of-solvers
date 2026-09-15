import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GuildDashboard from './features/guild-territory/components/GuildDashboard';
import WarMapUI from './features/war-room/components/WarMap';
import WarRoomUI from './features/war-room/components/WarRoom';
import StandingsUI from './features/league/components/Standings';
import { VillageDashboard } from './features/village/components/VillageDashboard';
import { SyncStatus } from './features/sync-status/components/SyncStatus';
import Phaser from 'phaser';
import WarMapScene from './game/WarMapScene';
import './wireframe.css';

const queryClient = new QueryClient();

function App() {
    const [view, setView] = useState('village');

    return (
        <div className="wf" style={{ width: '100vw', height: '100vh' }}>
            <div className="nav">
                <div className="brand">CodeForge</div>
                <div className="nav-links">
                    <span className={view === 'village' ? 'on' : ''} onClick={() => setView('village')} style={{ cursor: 'pointer' }}>Village</span>
                    <span>Attack</span>
                    <span className={view === 'guild' ? 'on' : ''} onClick={() => setView('guild')} style={{ cursor: 'pointer' }}>Guild</span>
                    <span className={view === 'map' ? 'on' : ''} onClick={() => setView('map')} style={{ cursor: 'pointer' }}>War Map</span>
                    <span className={view === 'room' ? 'on' : ''} onClick={() => setView('room')} style={{ cursor: 'pointer' }}>War Room</span>
                    <span className={view === 'standings' ? 'on' : ''} onClick={() => setView('standings')} style={{ cursor: 'pointer' }}>Standings</span>
                </div>
                <div className="nav-right">
                    <SyncStatus />
                    <div className="avatar">A</div>
                </div>
            </div>
            
            {view === 'village' && <VillageDashboard />}
            {view === 'guild' && <GuildDashboard />}
            {view === 'map' && <WarMapUI />}
            {view === 'room' && <WarRoomUI />}
            {view === 'standings' && <StandingsUI />}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
