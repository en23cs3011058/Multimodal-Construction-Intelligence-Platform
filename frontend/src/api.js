import { useState, useCallback } from "react";

const BASE = import.meta.env?.VITE_API_URL || "";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, options);
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running on port 8000.");
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) throw new Error(body?.error || body?.detail || `Request failed (${res.status}).`);
  return body;
}

export const postJson = (path, data) =>
  request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export const postForm = (path, form) => request(path, { method: "POST", body: form });
export const getJson = (path) => request(path);

/** Shared state machine for every analysis page: idle -> loading -> result | error. */
export function useRun() {
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const run = useCallback(async (fn) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await fn();
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e.message, data: null });
    }
  }, []);
  const reset = useCallback(() => setState({ loading: false, error: null, data: null }), []);
  return { ...state, run, reset };
}

export const money = (n, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n ?? 0);
  } catch {
    return `${currency} ${Math.round(n ?? 0).toLocaleString()}`;
  }
};
