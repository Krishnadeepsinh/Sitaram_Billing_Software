import { useSyncExternalStore } from "react";

export type BusinessMode = "cable" | "broadband";

export const getActiveBusinessMode = (): BusinessMode => {
  if (typeof window === "undefined") return "broadband";
  return localStorage.getItem("businessMode") === "cable" ? "cable" : "broadband";
};

export let activeBusinessMode = getActiveBusinessMode();
export let activeBusinessLabel = activeBusinessMode === "cable" ? "Cable" : "Broadband";

const listeners = new Set<() => void>();

const updateActiveBusinessMode = (mode: BusinessMode) => {
  activeBusinessMode = mode;
  activeBusinessLabel = mode === "cable" ? "Cable" : "Broadband";
};

const subscribeBusinessMode = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyBusinessModeChange = () => {
  listeners.forEach((listener) => listener());
};

export const useBusinessMode = () =>
  useSyncExternalStore(subscribeBusinessMode, getActiveBusinessMode, () => "broadband");

const postJson = async (path: string, body: unknown) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const db = {
  execute: (query: string | { sql: string; args?: unknown[] }, args?: unknown[]) => {
    const normalizedQuery = typeof query === "string" && args ? { sql: query, args } : query;
    return postJson("/api/db/execute", { mode: getActiveBusinessMode(), query: normalizedQuery });
  },
  batch: (queries: Array<string | { sql: string; args?: unknown[] }>, txMode: "read" | "write" = "write") => {
    return postJson("/api/db/batch", { mode: getActiveBusinessMode(), queries, txMode });
  },
};

export const hasTursoDB = true;

export const setActiveBusinessMode = (mode: BusinessMode) => {
  if (mode === getActiveBusinessMode()) return;
  localStorage.setItem("businessMode", mode);
  updateActiveBusinessMode(mode);
  notifyBusinessModeChange();
};
