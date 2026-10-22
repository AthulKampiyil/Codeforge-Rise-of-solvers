import Phaser from "phaser";
import React, { useEffect, useRef, useState } from "react";
import { getTrophies, getVillage } from "../api/villageApi";
import { useRealtimeEvent } from "../../../shared/websocket/client";
import VillageScene from "../../../game/VillageScene";
import { VillageSidebar } from "./VillageSidebar";

export function VillageDashboard({ SceneComponent }) {
  const [village, setVillage] = useState(null);
  const [trophies, setTrophies] = useState(0);
  const refresh = () =>
    getVillage()
      .then((data) => {
        setVillage(data);
        if (typeof window !== "undefined") {
          window.__codeforgeVillageState = data;
          window.dispatchEvent(new CustomEvent("codeforge:village-state", { detail: data }));
        }
      })
      .catch(() => setVillage({ topics: [] }));

  useEffect(() => {
    refresh();
    getTrophies().then((data) => setTrophies(data.trophy_count ?? data.trophies ?? 0));
  }, []);

  // The realtime socket itself is connected once for the whole session in
  // App.jsx — this just subscribes to the event this screen cares about.
  useRealtimeEvent("VILLAGE_UPDATED", refresh);

  return (
    <main className="village-layout">
      <VillageSidebar village={village} trophies={trophies} />
      <section className="village-stage">
        {SceneComponent ? <SceneComponent village={village} /> : <VillageCanvas village={village} />}
      </section>
    </main>
  );
}

function VillageCanvas({ village }) {
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current.innerHTML = "";

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: "100%",
      height: "100%",
      backgroundColor: "#173829",
      scene: [VillageScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    });

    game.events.once("step", () => game.scale.refresh());
    const handleWindowResize = () => game.scale.refresh();
    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (village && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("codeforge:village-state", { detail: village }));
    }
  }, [village]);

  return <div ref={containerRef} className="village-canvas" aria-label="Personal code village" />;
}
