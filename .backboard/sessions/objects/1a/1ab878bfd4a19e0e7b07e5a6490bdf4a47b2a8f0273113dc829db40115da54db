import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// client.js keeps both tokens in localStorage, so every lane's tests need
// a working one. On newer Node (>=22) the runtime exposes its own
// `localStorage` global that stays undefined unless the process is started
// with --localstorage-file, and it shadows the jsdom one that vitest would
// otherwise install. Install a minimal in-memory Storage only when the
// environment didn't provide one, so this stays a no-op on CI's Node 20.
function createMemoryStorage() {
  let store = new Map();
  return {
    get length() {
      return store.size;
    },
    key: (index) => [...store.keys()][index] ?? null,
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
    clear: () => {
      store = new Map();
    },
  };
}

if (typeof globalThis.localStorage === "undefined" || !globalThis.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});
