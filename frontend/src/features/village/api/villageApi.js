const API = import.meta.env.VITE_API_URL || "";

export async function getVillage() {
  const response = await fetch(`${API}/village/me`, { credentials: "include" });
  if (!response.ok) throw new Error("Unable to load village");
  return response.json();
}

export async function getTrophies() {
  const response = await fetch(`${API}/league/me`, { credentials: "include" });
  return response.ok ? response.json() : { trophy_count: 0 };
}
