import Phaser from "phaser";
import React, { useEffect, useRef, useState } from "react";
import { getTrophies, getVillage } from "../api/villageApi";
import { useRealtimeEvent } from "../../../shared/websocket/client";
import VillageScene from "../../../game/VillageScene";
import { VillageSidebar } from "./VillageSidebar";

export function VillageDashboard({ SceneComponent }) {
  const [village, setVillage] = useState(null);
  const [trophies, setTrophies] = useState(0);
  const refresh = () => getVillage().then((data) => { setVillage(data); window.dispatchEvent(new CustomEvent("codeforge:village-state", { detail: data })); }).catch(() => setVillage({ topics: [] }));
  useEffect(() => { refresh(); getTrophies().then((data) => setTrophies(data.trophy_count ?? data.trophies ?? 0)); }, []);
  // The realtime socket itself is connected once for the whole session in
  // App.jsx — this just subscribes to the event this screen cares about.
  useRealtimeEvent("VILLAGE_UPDATED", refresh);
  return <main className="village-layout"><VillageSidebar village={village} trophies={trophies} /><section className="village-stage">{SceneComponent ? <SceneComponent village={village} /> : <VillageCanvas />}</section></main>;
}

function VillageCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Defensive clear + a forced scale.refresh() once layout has settled:
    // see WarMapScene.create()/WarMap.jsx for the full explanation. In
    // short, under this app's dev setup a Phaser instance can be booted
    // (or, under React 18 StrictMode, double-booted) before its container's
    // real CSS size has settled, so RESIZE mode's initial measurement — and
    // any leftover <canvas> from a StrictMode-cleaned-up first instance —
    // both need to be corrected rather than trusted.
    containerRef.current.innerHTML = "";

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: "100%",
      height: "100%",
      backgroundColor: "#11151d",
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

  return <div ref={containerRef} className="village-canvas" aria-label="Personal code village" />;
}
