#!/usr/bin/env node
/**
 * One-time seeding/enrichment from Cricbuzz IPL 2026 auction squads.
 *
 * Source:
 *   https://www.cricbuzz.com/cricket-series/ipl-2026/auction/teams
 *
 * Pulls all teams (10) and their 25-player auction squads, extracting:
 * - name
 * - nationality
 * - role bucket (BAT/WK/ALL/BOWL based on section)
 * - is_overseas (nationality !== India)
 *
 * Then inserts missing players and updates existing rows for the given sport_id.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-ipl-players-from-cricbuzz-auction.mjs --sport ipl_2026
 *
 * Optional:
 *   --teams https://www.cricbuzz.com/cricket-series/ipl-2026/auction/teams
 *   --out data/ipl_auction_2026_cricbuzz.csv
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
const teamsUrl = argValue("teams", "https://www.cricbuzz.com/cricket-series/ipl-2026/auction/teams");
const outPath = argValue("out", `data/ipl_auction_cricbuzz_${sportId}.csv`);
const dryRun = String(argValue("dry-run", "false")).toLowerCase() === "true";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function fetchHtml(u) {
  const res = await fetch(u, { headers: { "user-agent": "bidly/1.0 (one-time seeding)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);
  return await res.text();
}

function uniqBy(list, keyFn) {
  const out = [];
  const seen = new Set();
  for (const x of list) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

function normalizeName(s) {
  return String(s ?? "").trim().replace(/\s+/g, " ");
}

function lowerKey(s) {
  return normalizeName(s).toLowerCase();
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function extractTeamIds(teamsIndexHtml) {
  const ids = [];
  const re = /\/auction\/teams\/(\d+)/g;
  let m;
  while ((m = re.exec(teamsIndexHtml))) ids.push(m[1]);
  return [...new Set(ids)];
}

function sectionRole(label) {
  const l = label.toLowerCase();
  if (l.includes("wicket")) return "WK";
  if (l.includes("all")) return "ALL";
  if (l.includes("bowler")) return "BOWL";
  if (l.includes("batter") || l.includes("bat")) return "BAT";
  return null;
}

function extractRosterFromTeamHtml(html) {
  const sections = ["Batters", "Wicket Keepers", "All Rounders", "Bowlers"];
  const out = [];
  const lower = html.toLowerCase();

  const idxs = sections
    .map((s) => {
      const i = lower.indexOf(`>${s.toLowerCase()}<`);
      return i >= 0 ? { s, i } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.i - b.i);

  if (!idxs.length) return out;

  for (let si = 0; si < idxs.length; si++) {
    const cur = idxs[si];
    const next = idxs[si + 1];
    const slice = html.slice(cur.i, next ? next.i : undefined);
    const role = sectionRole(cur.s);
    if (!role) continue;

    // Pattern observed:
    // <span ...>Virat Kohli</span> ... <span>India</span> ... retained
    // Extract (name, country) pairs within the section slice.
    const re =
      /<span[^>]*>\s*([^<]{2,80}?)\s*<\/span>[\s\S]{0,1200}?<span>\s*([A-Za-z .'-]{2,40}?)\s*<\/span>/g;
    let m;
    while ((m = re.exec(slice))) {
      const name = normalizeName(m[1]);
      const nationality = normalizeName(m[2]);
      // Filter out section headings and stray spans.
      if (!name || sections.includes(name)) continue;
      // Names sometimes repeat as part of other UI; require at least a space.
      if (!name.includes(" ")) continue;
      if (!nationality) continue;
      // Filter out non-country tokens that appear in chips.
      const natLow = nationality.toLowerCase();
      if (["retained", "withdrawn", "traded", "sold", "unsold"].includes(natLow)) continue;
      out.push({
        name,
        nationality,
        role,
        is_overseas: nationality.toLowerCase() !== "india",
      });
    }
  }

  // Deduplicate by (name,nationality,role)
  return uniqBy(out, (r) => `${lowerKey(r.name)}|${lowerKey(r.nationality)}|${r.role}`);
}

async function main() {
  console.log(`Fetching teams index: ${teamsUrl}`);
  const teamsIndexHtml = await fetchHtml(teamsUrl);
  const teamIds = extractTeamIds(teamsIndexHtml);
  if (!teamIds.length) throw new Error("No team IDs found on Cricbuzz teams index");
  console.log(`Found ${teamIds.length} team ids`);

  const roster = [];
  for (const id of teamIds) {
    const teamUrl = `${teamsUrl}/${id}`;
    console.log(`Fetching team roster: ${teamUrl}`);
    const html = await fetchHtml(teamUrl);
    const rows = extractRosterFromTeamHtml(html);
    console.log(`- extracted ${rows.length} player rows`);
    roster.push(...rows);
  }

  const unique = uniqBy(roster, (r) => lowerKey(r.name));
  unique.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Total unique players: ${unique.length}`);

  const fullOut = path.resolve(process.cwd(), outPath);
  await fs.mkdir(path.dirname(fullOut), { recursive: true });
  await fs.writeFile(
    fullOut,
    "name,nationality,role,is_overseas,source\n" +
      unique
        .map((r) => [r.name, r.nationality, r.role, r.is_overseas, teamsUrl].map(csvEscape).join(","))
        .join("\n") +
      "\n",
    "utf8",
  );
  console.log(`Wrote roster CSV -> ${outPath}`);

  if (dryRun) {
    console.log("Dry run: skipping DB writes.");
    return;
  }

  const { data: existing, error: eErr } = await supabase
    .from("players")
    .select("id, name")
    .eq("sport_id", sportId);
  if (eErr) throw eErr;
  const byLower = new Map((existing ?? []).map((p) => [lowerKey(p.name), p.id]));

  const toInsert = [];
  const toUpdate = [];

  for (const r of unique) {
    const key = lowerKey(r.name);
    const id = byLower.get(key);
    if (id) {
      // Use upsert-by-id for bulk updates; include required columns so a missing row can't violate NOT NULL.
      toUpdate.push({
        id,
        sport_id: sportId,
        name: r.name,
        nationality: r.nationality,
        role: r.role,
        is_overseas: r.is_overseas,
        // Required NOT NULL columns (keep idempotent + safe for existing rows).
        base_price: 0,
        stats: {},
        tier: null,
        image_url: null,
      });
    } else {
      toInsert.push({
        sport_id: sportId,
        name: r.name,
        nationality: r.nationality,
        is_overseas: r.is_overseas,
        role: r.role,
        base_price: 0,
        tier: null,
        stats: {},
        image_url: null,
      });
    }
  }

  console.log(`Existing: ${byLower.size} | Insert: ${toInsert.length} | Update: ${toUpdate.length}`);

  const CHUNK = 200;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { error: insErr } = await supabase.from("players").insert(chunk);
    if (insErr) throw insErr;
    console.log(`- inserted ${i + chunk.length}/${toInsert.length}`);
  }

  // Update in smaller chunks; each update is by id, but we can use upsert by id for bulk.
  for (let i = 0; i < toUpdate.length; i += CHUNK) {
    const chunk = toUpdate.slice(i, i + CHUNK);
    const { error: upErr } = await supabase.from("players").upsert(chunk, { onConflict: "id" });
    if (upErr) throw upErr;
    console.log(`- updated ${i + chunk.length}/${toUpdate.length}`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

