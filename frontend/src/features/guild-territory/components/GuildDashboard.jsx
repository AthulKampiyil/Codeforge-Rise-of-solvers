import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchMyGuild,
    fetchAllGuilds,
    createGuild,
    requestToJoin,
    fetchJoinRequests,
    approveRequest,
    rejectRequest,
    fetchTerritoryZones
} from '../api/guildApi';
import { useAuth } from '../../../shared/auth/AuthContext.jsx';

function GuildDashboard() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('ROSTER');
    const [createName, setCreateName] = useState('');

    const { user } = useAuth();

    const { data: guild, isLoading: guildLoading } = useQuery({
        queryKey: ['myGuild'],
        queryFn: fetchMyGuild
    });

    const { data: zones } = useQuery({
        queryKey: ['territory'],
        queryFn: fetchTerritoryZones
    });

    const { data: joinRequests } = useQuery({
        queryKey: ['joinRequests', guild?.id],
        queryFn: () => fetchJoinRequests(guild.id),
        enabled: !!guild && (
            guild.memberships.find(m => m.user_id === user?.id)?.role === 'leader' || 
            guild.memberships.find(m => m.user_id === user?.id)?.role === 'officer'
        )
    });

    const { data: allGuilds } = useQuery({
        queryKey: ['allGuilds'],
        queryFn: fetchAllGuilds,
        enabled: !guild && !guildLoading
    });

    const createMutation = useMutation({
        mutationFn: (name) => createGuild(name),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myGuild'] })
    });

    const joinMutation = useMutation({
        mutationFn: (id) => requestToJoin(id),
        onSuccess: () => alert('Request sent!')
    });

    const approveMutation = useMutation({
        mutationFn: (reqId) => approveRequest(guild.id, reqId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['joinRequests', guild?.id] });
            queryClient.invalidateQueries({ queryKey: ['myGuild'] });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (reqId) => rejectRequest(guild.id, reqId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['joinRequests', guild?.id] });
        }
    });

    if (guildLoading) return <div style={{padding: '20px', color: '#fff'}}>Loading...</div>;

    if (!guild) {
        return (
            <div style={{padding: '40px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto'}}>
                <h2>Guilds</h2>
                <div style={{display: 'flex', gap: '10px'}}>
                    <input 
                        type="text" 
                        placeholder="Guild Name" 
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        style={{background: '#0d1117', border: '1px solid #2a323d', color: '#fff', padding: '8px 12px', flex: '1'}}
                    />
                    <button className="btn btn-gold" onClick={() => createMutation.mutate(createName)}>Create Guild</button>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px'}}>
                    <h3>Browse Guilds</h3>
                    {allGuilds?.map(g => (
                        <div key={g.id} style={{display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#0d1117', border: '1px solid #2a323d'}}>
                            <div>
                                <div style={{fontWeight: 'bold'}}>{g.name}</div>
                                <div className="dim mono" style={{fontSize: '12px'}}>{g.description || 'No description'}</div>
                            </div>
                            <button className="btn btn-ghost" onClick={() => joinMutation.mutate(g.id)}>Request to Join</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const myMembership = guild.memberships.find(m => m.user_id === user?.id);
    const isOfficer = myMembership?.role === 'leader' || myMembership?.role === 'officer';

    let totalInfluence = 0;
    const guildZones = [];
    if (zones) {
        zones.forEach(z => {
            if (z.scores && z.scores[guild.id]) {
                const score = Math.floor(z.scores[guild.id]);
                totalInfluence += score;
                if (z.owning_guild_id === guild.id || score > 0) {
                    guildZones.push({ ...z, myScore: score });
                }
            }
        });
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100vh', background: '#05080c', color: '#8b949e', fontFamily: 'sans-serif', overflow: 'hidden'}}>
            {/* Header */}
            <div style={{padding: '24px 32px', borderBottom: '1px solid #1a222d', display: 'flex', alignItems: 'center', gap: '20px'}}>
                <div className="avatar" style={{width: '56px', height: '56px', fontSize: '24px', background: '#1c170d', color: '#c9a227', border: '1px solid rgba(201,162,39,.3)'}}>
                    {guild.name.charAt(0).toUpperCase()}
                </div>
                <div style={{flex: '1'}}>
                    <h1 style={{margin: '0 0 6px 0', fontSize: '24px', color: '#ffffff', letterSpacing: '-0.5px'}}>{guild.name}</h1>
                    <div className="mono" style={{fontSize: '12px'}}>
                        Founded Season I · {guild.memberships.length} Members · Rank #3
                    </div>
                </div>
                <div style={{textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px'}}>
                    <div className="pill" style={{borderColor: 'rgba(74,201,127,.3)', color: '#4ac97f', background: 'rgba(74,201,127,.05)', padding: '6px 12px', fontSize: '13px'}}>
                        <i className="dot" style={{background: '#4ac97f'}}></i>{totalInfluence.toLocaleString()} TOTAL INFLUENCE
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div style={{display: 'flex', flex: '1', minHeight: '0', padding: '24px 32px', gap: '24px', overflow: 'auto'}}>
                <div className="col" style={{flex: '1'}}>
                    <div className="tabs">
                        <div className={`tab ${tab === 'ROSTER' ? 'active' : ''}`} onClick={() => setTab('ROSTER')}>ROSTER</div>
                        <div className={`tab ${tab === 'TECH' ? 'active' : ''}`} onClick={() => setTab('TECH')}>TECH</div>
                        <div className={`tab ${tab === 'DIPLOMACY' ? 'active' : ''}`} onClick={() => setTab('DIPLOMACY')}>DIPLOMACY</div>
                    </div>
                    
                    <div className="panel" style={{marginTop: '20px', flex: '1'}}>
                        {tab === 'ROSTER' && (
                            <div className="panel-b" style={{padding: '0'}}>
                                <table className="roster-table" style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', color: '#c9d1d9'}}>
                                    <thead>
                                        <tr style={{borderBottom: '1px solid rgba(42,50,61,.5)', color: '#8b949e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px'}}>
                                            <th style={{padding: '12px 14px', width: '30px'}}>#</th>
                                            <th style={{padding: '12px 14px'}}>MEMBER</th>
                                            <th style={{padding: '12px 14px'}}>LVL</th>
                                            <th style={{padding: '12px 14px'}}>SOLVED</th>
                                            <th style={{padding: '12px 14px'}}>ATTACKS</th>
                                            <th style={{padding: '12px 14px'}}>ROLE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {guild.memberships.map((m, idx) => {
                                            const isMe = m.user_id === user?.id;
                                            const roleColor = m.role === 'leader' ? '#c9a227' : (m.role === 'officer' ? '#3b82f6' : '#8b949e');
                                            
                                            return (
                                                <tr key={m.user_id} style={{borderBottom: '1px solid rgba(42,50,61,.3)', background: isMe ? 'rgba(201,162,39,.05)' : 'transparent'}}>
                                                    <td className="mono dim" style={{padding: '10px 14px'}}>{idx + 1}</td>
                                                    <td style={{padding: '10px 14px'}}>
                                                        <div style={{display: 'flex', alignItems: 'center', gap: '9px'}}>
                                                            <div className="avatar" style={{width: '26px', height: '26px', fontSize: '11px'}}>
                                                                {m.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={{fontSize: '12.5px', color: isMe ? '#c9a227' : '#fff'}}>{m.username}</span>
                                                        </div>
                                                    </td>
                                                    <td className="mono" style={{padding: '10px 14px'}}>{m.level}</td>
                                                    <td className="mono" style={{padding: '10px 14px'}}>{m.solved_count}</td>
                                                    <td className="mono" style={{padding: '10px 14px'}}>{m.attack_count}</td>
                                                    <td style={{padding: '10px 14px'}}>
                                                        <span className="pill" style={{color: roleColor, borderColor: `rgba(${m.role === 'leader' ? '201,162,39' : (m.role === 'officer' ? '59,130,246' : '139,148,158')}, 0.5)`}}>
                                                            {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {tab === 'TECH' && <div style={{padding: '40px', textAlign: 'center'}}>Tech Tree locked until Season II</div>}
                        {tab === 'DIPLOMACY' && <div style={{padding: '40px', textAlign: 'center'}}>No active treaties.</div>}
                    </div>
                </div>

                <div className="col" style={{width: '330px', flex: '0 0 330px'}}>
                    {isOfficer && (
                        <div className="panel" style={{marginBottom: '24px'}}>
                            <div className="panel-h">
                                <div className="panel-t">Join requests</div>
                                <span className="pill" style={{marginLeft: 'auto', color: '#c9a227', borderColor: 'rgba(201,162,39,.5)'}}>
                                    {joinRequests?.length || 0} pending
                                </span>
                            </div>
                            <div className="panel-b" style={{padding: '0'}}>
                                {joinRequests?.map(req => (
                                    <div key={req.id} style={{padding: '12px 14px', borderBottom: '1px solid rgba(42,50,61,.5)', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                            <div className="avatar" style={{width: '30px', height: '30px', fontSize: '12px'}}>U</div>
                                            <div style={{flex: '1'}}>
                                                <div style={{fontSize: '12.5px'}}>User {req.user_id.substring(0,6)}</div>
                                            </div>
                                        </div>
                                        <div style={{display: 'flex', gap: '7px'}}>
                                            <div className="btn btn-sm btn-gold" style={{flex: '1'}} onClick={() => approveMutation.mutate(req.id)}>Approve</div>
                                            <div className="btn btn-sm btn-ghost" style={{flex: '1'}} onClick={() => rejectMutation.mutate(req.id)}>Reject</div>
                                        </div>
                                    </div>
                                ))}
                                {!joinRequests?.length && <div style={{padding: '15px', textAlign: 'center', fontSize: '12px'}}>No pending requests</div>}
                            </div>
                        </div>
                    )}

                    <div className="panel" style={{flex: '1', minHeight: '0'}}>
                        <div className="panel-h">
                            <div className="panel-t">Zones held</div>
                        </div>
                        <div className="panel-b" style={{gap: '11px'}}>
                            {guildZones.length > 0 ? guildZones.map(z => {
                                const isOwned = z.owning_guild_id === guild.id;
                                return (
                                    <div key={z.id} style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                        <div style={{display: 'flex', alignItems: 'baseline'}}>
                                            <span style={{fontSize: '12.5px', color: isOwned ? '#fff' : '#8b949e'}}>{z.name}</span>
                                            <span className={isOwned ? "mono gold" : "mono bad"} style={{marginLeft: 'auto', fontSize: '11.5px'}}>
                                                {isOwned ? 'held' : 'contested'}
                                            </span>
                                        </div>
                                        <div className="dim mono" style={{fontSize: '10.5px'}}>score {z.myScore.toLocaleString()}</div>
                                    </div>
                                );
                            }) : (
                                <div style={{textAlign: 'center', padding: '20px 0', fontSize: '12px'}}>No territory held</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GuildDashboard;
