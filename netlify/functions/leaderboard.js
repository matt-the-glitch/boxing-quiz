// Netlify Function: Persistent leaderboard using Netlify Blobs
// GET  → returns top 10
// POST → submits a score, returns updated top 10

const { getStore } = require("@netlify/blobs");

const MAX_ENTRIES = 10;
const MAX_SCORE = 200; // sanity check
const STORE_KEY = "top10";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const store = getStore("leaderboard");

  try {
    if (event.httpMethod === "GET") {
      const data = await store.get(STORE_KEY, { type: "json" });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data || []),
      };
    }

    if (event.httpMethod === "POST") {
      const { name, score } = JSON.parse(event.body || "{}");

      // Validate
      if (!name || typeof name !== "string" || name.length > 50) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid name" }) };
      }
      if (typeof score !== "number" || score < 0 || score > MAX_SCORE) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid score" }) };
      }

      // Read current leaderboard
      const current = (await store.get(STORE_KEY, { type: "json" })) || [];

      // Check if this score qualifies for top 10
      if (current.length >= MAX_ENTRIES && score <= current[current.length - 1].score) {
        // Score too low, return current leaderboard unchanged
        return { statusCode: 200, headers, body: JSON.stringify(current) };
      }

      // Add new entry
      current.push({
        name: name.substring(0, 50),
        score,
        date: new Date().toISOString(),
      });

      // Sort descending by score, then by date (earlier = higher)
      current.sort((a, b) => b.score - a.score || new Date(a.date) - new Date(b.date));

      // Keep only top 10
      const top10 = current.slice(0, MAX_ENTRIES);

      // Save
      await store.setJSON(STORE_KEY, top10);

      return { statusCode: 200, headers, body: JSON.stringify(top10) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    console.error("Leaderboard error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal error" }) };
  }
};
