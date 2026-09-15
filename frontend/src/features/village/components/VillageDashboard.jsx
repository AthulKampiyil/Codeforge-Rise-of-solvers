import Phaser from "phaser";
import React, { useEffect, useRef, useState } from "react";
import { getTrophies, getVillage } from "../api/villageApi";
import { realtimeClient, useRealtimeEvent } from "../../../shared/websocket/client";
import VillageScene from "../../../game/VillageScene";
import { VillageSidebar } from "./VillageSidebar";

export function VillageDashboard({ SceneComponent }) {
  const [village, setVillage] = useState(null);
  const [trophies, setTrophies] = useState(0);
  const refresh = () => getVillage().then((data) => { setVillage(data); window.dispatchEvent(new CustomEvent("codeforge:village-state", { detail: data })); }).catch(() => setVillage({ topics: [] }));
  useEffect(() => { refresh(); getTrophies().then((data) => setTrophies(data.trophy_count ?? data.trophies ?? 0)); }, []);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) realtimeClient.connect(token);
    return () => realtimeClient.disconnect();
  }, []);
  useRealtimeEvent("VILLAGE_UPDATED", refresh);
  return <main className="village-layout"><VillageSidebar village={village} trophies={trophies} /><section className="village-stage">{SceneComponent ? <SceneComponent village={village} /> : <VillageCanvas />}</section></main>;
}

function VillageCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: "100%",
      height: "100%",
      backgroundColor: "#11151d",
      scene: [VillageScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    });
    return () => game.destroy(true);
  }, []);

  return <div ref={containerRef} className="village-canvas" aria-label="Personal code village" />;
}
