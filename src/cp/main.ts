import { mountCodeForgeUI } from "./ui";
import { cpVillageStore } from "./store";
import { getAccessToken } from "./client";

/** Mounts the standalone CodeForge workflow without starting a Phaser game. */
export function mountCodeForgeWorkflows(): () => void {
  let manuallyStopped = false;
  let disposed = false;
  const disposeUI = mountCodeForgeUI();

  const checkSession = () => {
    if (manuallyStopped) return;
    if (getAccessToken()) void cpVillageStore.start();
    else cpVillageStore.stop();
  };
  checkSession();
  const sessionPoll = window.setInterval(checkSession, 1200);
  const onVisibility = () => {
    if (document.visibilityState === "visible" && getAccessToken() && !manuallyStopped) void cpVillageStore.refresh();
  };
  const onOnline = () => {
    if (getAccessToken() && !manuallyStopped) void cpVillageStore.refresh();
  };
  const onAuthExpired = () => cpVillageStore.stop();
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) window.location.reload();
  };
  const onPageHide = (event: PageTransitionEvent) => {
    if (!event.persisted) cleanup();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onOnline);
  window.addEventListener("codeforge:auth-expired", onAuthExpired);
  window.addEventListener("pageshow", onPageShow);

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    manuallyStopped = true;
    window.clearInterval(sessionPoll);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("codeforge:auth-expired", onAuthExpired);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("pagehide", onPageHide);
    cpVillageStore.stop();
    disposeUI();
  };
  window.addEventListener("pagehide", onPageHide);
  return cleanup;
}
