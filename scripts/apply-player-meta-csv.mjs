#!/usr/bin/env node
/**
 * Apply a CSV of enriched player metadata to Supabase `players`.
 *
 * Input CSV headers (required):
 *   id,name,nationality,role,is_overseas
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/apply-player-meta-csv.mjs --in data/player_meta_ipl_2026.csv
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";

function argValue(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) return fallback;
  return v;
}

const inPath = argValue("in", null);
if (!inPath) {
  console.error("Missing --in <csv-path>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function parseCsv(text) {
  // Minimal CSV parser (handles quotes/double-quotes).
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cur);
      cur = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    if (ch === "\r") continue;
    cur += ch;
  }
  row.push(cur);
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function toBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return null;
}

async function main() {
  const csv = await fs.readFile(inPath, "utf8");
  const grid = parseCsv(csv.trim() + "\n");
  if (grid.length < 2) throw new Error("CSV must have header + at least 1 row");
  const headers = grid[0].map((h) => h.trim());
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  for (const k of ["id", "nationality", "role", "is_overseas"]) {
    if (!(k in idx)) throw new Error(`Missing required column: ${k}`);
  }

  const updates = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const id = (row[idx.id] ?? "").trim();
    if (!id) continue;
    const nationality = (row[idx.nationality] ?? "").trim() || null;
    const role = (row[idx.role] ?? "").trim().toUpperCase() || null;
    const is_overseas = toBool(row[idx.is_overseas]);
    updates.push({ id, nationality, role, is_overseas });
  }

  console.log(`Applying ${updates.length} player updates from ${inPath}`);

  // Batch updates: supabase-js doesn't support bulk update by different values in one call,
  // so we do upserts restricted to the columns we control.
  const payload = updates.map((u) => ({
    id: u.id,
    nationality: u.nationality,
    role: u.role,
    is_overseas: u.is_overseas,
  }));

  const { error } = await supabase.from("players").upsert(payload, { onConflict: "id" });
  if (error) throw error;

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

