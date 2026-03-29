// Netlify Function v2 (ESM): Persistent leaderboard via Netlify Blobs
// GET  → returns top 10
// POST → submits a score, returns updated top 10

import { getStore } from "@netlify/blobs";

const MAX_ENTRIES = 10;
const MAX_SCORE   = 200;
const STORE_KEY   = "top10";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers });
  }

  const store = getStore("leaderboard");

  try {
    if (req.method === "GET") {
      const data = await store.get(STORE_KEY, { type: "json" });
      return new Response(JSON.stringify(data || []), { status: 200, headers });
    }

    if (req.method === "POST") {
      const { name, score } = await req.json();

      if (!name || typeof name !== "string" || name.length > 50) {
        return new Response(JSON.stringify({ error: "Invalid name" }), { status: 400, headers });
      }
      if (typeof score !== "number" || score < 0 || score > MAX_SCORE) {
        return new Response(JSON.stringify({ error: "Invalid score" }), { status: 400, headers });
      }

      const current = (await store.get(STORE_KEY, { type: "json" })) || [];

      if (current.length >= MAX_ENTRIES && score <= current[current.length - 1].score) {
        return new Response(JSON.stringify(current), { status: 200, headers });
      }

      current.push({ name: name.substring(0, 50), score, date: new Date().toISOString() });
      current.sort((a, b) => b.score - a.score || new Date(a.date) - new Date(b.date));
      const top10 = current.slice(0, MAX_ENTRIES);

      await store.setJSON(STORE_KEY, top10);
      return new Response(JSON.stringify(top10), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });

  } catch (err) {
    console.error("Leaderboard error:", err.message);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers });
  }
};
