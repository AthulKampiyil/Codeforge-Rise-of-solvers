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
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // The scene reports where the close glyph ended up on screen. The button is
    // positioned straight on the DOM node: the position changes every frame
    // while the panel is open, and re-rendering React for that is wasteful.
    const handleTopicPanelPosition = (event) => {
      const button = closeButtonRef.current;
      if (!button) return;

      const rect = event.detail;
      if (!rect) {
        button.style.visibility = "hidden";
        button.style.pointerEvents = "none";
        return;
      }

      // The inline styles are the source of truth, so a re-created button node
      // picks the position up again on the next event.
      const left = `${rect.x}px`;
      const top = `${rect.y}px`;
      const width = `${rect.width}px`;
      const height = `${rect.height}px`;

      if (
        button.style.left !== left ||
        button.style.top !== top ||
        button.style.width !== width ||
        button.style.height !== height ||
        button.style.visibility !== "visible"
      ) {
        button.style.left = left;
        button.style.top = top;
        button.style.width = width;
        button.style.height = height;
        button.style.visibility = "visible";
        button.style.pointerEvents = "auto";
      }
    };
    window.addEventListener("codeforge:topic-panel-position", handleTopicPanelPosition);
    return () => window.removeEventListener("codeforge:topic-panel-position", handleTopicPanelPosition);
  }, []);

  useEffect(() => {
    containerRef.current.innerHTML = "";

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      backgroundColor: "#173829",
      scene: [VillageScene],
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    });

    let resizeFrame = null;
    let disposed = false;
    const refreshScale = () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        if (!disposed) game.scale.refresh();
      });
    };

    // Measure after layout settles, then keep Phaser's pointer mapping in sync
    // when the stage changes size (for example, when the sidebar is collapsed).
    game.events.once("step", refreshScale);
    const observer = new ResizeObserver(refreshScale);
    observer.observe(containerRef.current);
    const handleWindowResize = refreshScale;
    window.addEventListener("resize", handleWindowResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", handleWindowResize);
      observer.disconnect();
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    if (village && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("codeforge:village-state", { detail: village }));
    }
  }, [village]);

  return (
    <div className="village-canvas" aria-label="Personal code village">
      <div ref={containerRef} className="village-game" />
      <button
        type="button"
        aria-label="Close topic popup"
        className="village-topic-close-hitbox"
        ref={closeButtonRef}
        onClick={() => window.dispatchEvent(new Event("codeforge:close-topic"))}
      />
    </div>
  );
}
