import React, { useEffect, useState } from "react";
import { getTrophies, getVillage } from "../api/villageApi";
import { useRealtimeEvent } from "../hooks/useRealtimeEvent";
import { VillageSidebar } from "./VillageSidebar";

export function VillageDashboard({ SceneComponent }) {
  const [village, setVillage] = useState(null);
  const [trophies, setTrophies] = useState(0);
  const refresh = () => getVillage().then((data) => { setVillage(data); window.dispatchEvent(new CustomEvent("codeforge:village-state", { detail: data })); }).catch(() => setVillage({ topics: [] }));
  useEffect(() => { refresh(); getTrophies().then((data) => setTrophies(data.trophy_count ?? data.trophies ?? 0)); }, []);
  useRealtimeEvent("VILLAGE_UPDATED", refresh);
  return <main className="village-layout"><VillageSidebar village={village} trophies={trophies} /><section className="village-stage">{SceneComponent ? <SceneComponent village={village} /> : <div className="scene-placeholder">Your village is loading...</div>}</section></main>;
}
