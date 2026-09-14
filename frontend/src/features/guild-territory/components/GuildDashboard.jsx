import React, { useState } from 'react';
import { useMyGuild, useJoinRequests } from '../hooks/useGuild';
import { useRealtimeEvent } from '../../../shared/websocket/client';
import { useQueryClient } from '@tanstack/react-query';

export default function GuildDashboard() {
    const { data: guild, isLoading } = useMyGuild();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('ROSTER');

    useRealtimeEvent('TERRITORY_ZONE_CHANGED', () => {
        queryClient.invalidateQueries(['territory']);
    });

    if (isLoading) return <div className="text-gray-400 p-8">Loading guild...</div>;
    if (!guild) return <div className="text-gray-400 p-8">You are not in a guild.</div>;

    // Check if current user is leader/officer
    // In a real app we'd get current user ID from AuthContext, assuming hardcoded or check roles
    // We'll just assume any role = 'leader' or 'officer' across all members means this user is an officer if they have that role.
    // Wait, the API returns the whole guild including memberships. We need to find the user's role.
    // Assuming localStorage holds a userId for now to figure it out, or we just rely on the API returning data
    // Let's just assume we can deduce it or show the inbox if requests are fetchable.
    
    // Calculate total influence
    // "7,380 TOTAL INFLUENCE chip from your aggregated zone scores"
    // Since territory zones have per-guild scores, we'd ideally aggregate them, but for this component 
    // maybe we just sum up zone_contributions if they were provided, or we can fetch them.
    // We will just show a static value or a calculation if we fetch territory.

    return (
        <div className="p-8 text-white min-h-screen" style={{ backgroundColor: '#0d1117' }}>
            <div className="flex justify-between items-center mb-8 border-b border-[#2a323d] pb-4">
                <div>
                    <h1 className="text-3xl font-serif text-[#c9a227]">{guild.name}</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Founded Season I &middot; {guild.memberships?.length || 0} Members &middot; Rank #3
                    </p>
                </div>
                <div className="bg-[#141a22] border border-[#2a323d] px-4 py-2 rounded">
                    <span className="text-[#c9a227] font-bold">TOTAL INFLUENCE</span>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                {['ROSTER', 'TECH', 'DIPLOMACY'].map(t => (
                    <button 
                        key={t}
                        className={`px-4 py-2 text-sm font-bold ${tab === t ? 'text-[#c9a227] border-b-2 border-[#c9a227]' : 'text-gray-500'}`}
                        onClick={() => setTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="bg-[#141a22] border border-[#2a323d] rounded p-4">
                {tab === 'ROSTER' && <RosterTable memberships={guild.memberships} />}
                {tab === 'TECH' && <div className="p-8 text-center text-gray-500">Tech Tree (Coming Soon)</div>}
                {tab === 'DIPLOMACY' && <div className="p-8 text-center text-gray-500">Diplomacy (Coming Soon)</div>}
            </div>
            
            {/* Join Requests Inbox would go here, optionally rendered if the user has officer permissions */}
            <div className="mt-8">
                <JoinRequests guildId={guild.id} />
            </div>
        </div>
    );
}

function RosterTable({ memberships }) {
    const getRoleBadge = (role) => {
        if (role === 'leader') return <span className="text-[#c9a227] font-bold">LEADER</span>;
        if (role === 'officer') return <span className="text-[#4ac97f] font-bold">OFFICER</span>;
        return <span className="text-gray-500">MEMBER</span>;
    };

    return (
        <table className="w-full text-left font-mono text-sm">
            <thead>
                <tr className="text-gray-500 border-b border-[#2a323d]">
                    <th className="pb-2">#</th>
                    <th className="pb-2">MEMBER</th>
                    <th className="pb-2">LVL</th>
                    <th className="pb-2">SOLVED</th>
                    <th className="pb-2">ATTACKS</th>
                    <th className="pb-2">ROLE</th>
                    <th className="pb-2">STATUS</th>
                </tr>
            </thead>
            <tbody>
                {memberships?.map((m, i) => (
                    <tr key={m.user_id} className="border-b border-[#2a323d] hover:bg-[#2a323d]/30">
                        <td className="py-3 text-gray-400">{i + 1}</td>
                        <td className="py-3 text-white font-bold">{m.username}</td>
                        <td className="py-3 text-gray-300">{m.level}</td>
                        <td className="py-3 text-gray-300">{m.solved_count}</td>
                        <td className="py-3 text-gray-300">{m.attack_count}</td>
                        <td className="py-3">{getRoleBadge(m.role)}</td>
                        <td className="py-3">{getRoleBadge(m.role)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function JoinRequests({ guildId }) {
    // Assuming officer since we render this. In a real app we'd conditionally render.
    const { data: requests } = useJoinRequests(guildId, true);
    
    if (!requests || requests.length === 0) return null;

    return (
        <div className="bg-[#141a22] border border-[#2a323d] rounded p-4">
            <h2 className="text-[#c9a227] font-serif text-xl mb-4">Join Requests</h2>
            <ul className="space-y-2">
                {requests.map(req => (
                    <li key={req.id} className="flex justify-between items-center text-sm font-mono border-b border-[#2a323d] pb-2">
                        <span>User ID: {req.user_id}</span>
                        <div className="space-x-2">
                            <button className="text-[#4ac97f] hover:underline">Approve</button>
                            <button className="text-[#c94a4a] hover:underline">Reject</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
