// src/api/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/colors";

const KEY = "amplify_token";

async function req(path, opts = {}) {
  const token = await AsyncStorage.getItem(KEY);
  const r = await fetch(API_BASE_URL + path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(opts.headers || {}),
    },
  });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(b.message || "Request failed");
  return b;
}

export const api = {
  KEY,
  register: (d) =>
    req("/auth/register", { method: "POST", body: JSON.stringify(d) }),
  login: (d) => req("/auth/login", { method: "POST", body: JSON.stringify(d) }),
  me: () => req("/auth/me"),
  update: (d) => req("/auth/me", { method: "PATCH", body: JSON.stringify(d) }),
  campaigns: (q) => req("/campaigns" + (q ? "?" + q : "")),
  campaign: (id) => req("/campaigns/" + id),
  create: (d) => req("/campaigns", { method: "POST", body: JSON.stringify(d) }),
  updateCampaign: (id, d) =>
    req("/campaigns/" + id, { method: "PATCH", body: JSON.stringify(d) }),
  mine: () => req("/campaigns/mine"),
  saved: () => req("/campaigns/saved/mine"),
  save: (id) =>
    req("/campaigns/" + id + "/save", { method: "POST", body: "{}" }),
  contribute: (d) =>
    req("/contributions", { method: "POST", body: JSON.stringify(d) }),
  activity: () => req("/activity"),
  read: (id) =>
    req("/activity/" + id + "/read", { method: "PATCH", body: "{}" }),
  summary: () => req("/activity/summary"),
};