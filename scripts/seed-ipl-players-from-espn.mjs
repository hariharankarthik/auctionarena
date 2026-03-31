#!/usr/bin/env node
/**
 * One-time seeding: pull IPL squad player names from ESPNcricinfo squads pages
 * and insert them into Supabase `players` for a given sport_id.
 *
 * This seeds NAMES ONLY (role/nationality/overseas are enriched separately).
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-ipl-players-from-espn.mjs --sport ipl_2026
 *
 * Optional:
 *   --squads https://www.espncricinfo.com/series/ipl-2026-1510719/squads
 *   --out data/ipl_players_espn.csv
 *   --dry-run true
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

function argValue(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) return fallback;
  return v;
}

const sportId = argValue("sport", "ipl_2026");
const outPath = argValue("out", `data/ipl_players_espn_${sportId}.csv`);
const dryRun = String(argValue("dry-run", "false")).toLowerCase() === "true";
const squadsIndex = argValue(
  "squads",
  "https://www.espncricinfo.com/series/ipl-2026-1510719/squads",
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function uniqCaseInsensitive(list) {
  const seen = new Set();
  const out = [];
  for (const s of list) {
    const t = String(s ?? "").trim().replace(/\s+/g, " ");
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

async function fetchHtml(u) {
  const res = await fetch(u, { headers: { "user-agent": "bidly/1.0 (one-time seeding)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);
  return await res.text();
}

function extractSquadLinks(indexHtml) {
  const links = new Set();
  const re = /href="([^"]+\/series-squads)"/gi;
  let m;
  while ((m = re.exec(indexHtml))) {
    const href = m[1];
    if (!href) continue;
    const abs = href.startsWith("http") ? href : `https://www.espncricinfo.com${href}`;
    links.add(abs);
  }
  return [...links];
}

function extractPlayerNamesFromSquadPage(html) {
  // Players appear as profile links:
  //   <a ... href="/cricketers/rohit-sharma-34102">Rohit Sharma</a>
  // Also include withdrawn players, etc. We'll de-dupe later.
  const names = [];
  const re = /href="\/cricketers\/[^"]+"\s*[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const name = String(m[1] ?? "").trim();
    // Filter obvious non-names
    if (!name) continue;
    if (name.length < 3) continue;
    names.push(name);
  }
  return uniqCaseInsensitive(names);
}

async function main() {
  console.log(`Fetching squads index: ${squadsIndex}`);
  const indexHtml = await fetchHtml(squadsIndex);
  const squadLinks = extractSquadLinks(indexHtml);
  if (!squadLinks.length) throw new Error("No squad links found on squads index");
  console.log(`Found ${squadLinks.length} squad pages`);

  const allNames = [];
  for (const link of squadLinks) {
    console.log(`Fetching squad page: ${link}`);
    const html = await fetchHtml(link);
    const names = extractPlayerNamesFromSquadPage(html);
    console.log(`- ${names.length} player names`);
    allNames.push(...names);
  }

  const unique = uniqCaseInsensitive(allNames);
  unique.sort((a, b) => a.localeCompare(b));
  console.log(`Total unique names: ${unique.length}`);

  const fullOut = path.resolve(process.cwd(), outPath);
  await fs.mkdir(path.dirname(fullOut), { recursive: true });
  await fs.writeFile(
    fullOut,
    ["name"].join(",") + "\n" + unique.map((n) => csvEscape(n)).join("\n") + "\n",
    "utf8",
  );
  console.log(`Wrote names CSV -> ${outPath}`);

  if (dryRun) {
    console.log("Dry run: skipping DB insert.");
    return;
  }

  // Insert only if missing (case-insensitive check in JS; DB has no unique index on lower(name)).
  const { data: existing, error: eErr } = await supabase
    .from("players")
    .select("id, name")
    .eq("sport_id", sportId);
  if (eErr) throw eErr;
  const existingLower = new Set((existing ?? []).map((p) => String(p.name ?? "").trim().toLowerCase()));
  const toInsert = unique.filter((n) => !existingLower.has(n.toLowerCase()));

  console.log(`Inserting ${toInsert.length} new players into sport_id=${sportId} (existing ${existingLower.size})`);
  const rows = toInsert.map((name) => ({
    sport_id: sportId,
    name,
    nationality: null,
    is_overseas: false,
    role: "BAT",
    base_price: 0,
    tier: null,
    stats: {},
    image_url: null,
  }));

  // Chunk inserts to avoid payload limits.
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error: insErr } = await supabase.from("players").insert(chunk);
    if (insErr) throw insErr;
    console.log(`- inserted ${i + chunk.length}/${rows.length}`);
  }

  console.log("Done seeding names.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

