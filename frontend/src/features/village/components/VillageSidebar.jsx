import React from "react";
import "./village.css";

export function VillageSidebar({ village, trophies = 0, attacks = "—" }) {
  const topics = village?.topics || [];
  return (
    <aside className="village-sidebar">
      <div className="player-card">
        <div className="avatar-chip">{(village?.username || "S").slice(0, 1).toUpperCase()}</div>
        <div><strong>{village?.username || "Solver"}</strong><span>Level {Math.max(1, Math.round(village?.average_level || 0))} · Strategist</span></div>
      </div>
      <div className="stat-row">
        <div><b>{village?.total_solved ?? 0}</b><span>SOLVED</span></div>
        <div><b>{attacks}</b><span>ATTACKS</span></div>
        <div><b>{trophies}</b><span>STARS</span></div>
      </div>
      <div className="influence-heading"><span>TOPIC INFLUENCE</span><em>RATING {Math.round(village?.defense_rating || 0)}</em></div>
      <div className="topic-list">
        {topics.map((topic) => (
          <div className="topic-row" key={topic.id || topic.name}>
            <div className="topic-label"><span>{topic.display_name || topic.name}</span><small>LV {topic.level}</small></div>
            <div className="topic-track"><i style={{ width: `${Math.min(100, topic.progress_pct || 0)}%` }} /></div>
            <small className="topic-delta">+{Math.round(topic.progress_pct || 0)}%</small>
          </div>
        ))}
      </div>
    </aside>
  );
}
