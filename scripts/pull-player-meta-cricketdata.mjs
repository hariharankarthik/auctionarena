#!/usr/bin/env node
/**
 * One-time enrichment: generate a CSV of player nationality/role/overseas.
 *
 * Source: cricketdata.org public player search pages.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/pull-player-meta-cricketdata.mjs --sport ipl_2026 --out data/player_meta_cricketdata.csv
 *
 * Optional:
 *   --limit 50
 *   --offset 0
 *   --concurrency 6
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

function intArg(name, fallback) {
  const v = argValue(name, null);
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const sportId = argValue("sport", "ipl_2026");
const outPath = argValue("out", `data/player_meta_${sportId}.csv`);
const limit = intArg("limit", 0);
const offset = intArg("offset", 0);
const concurrency = Math.max(1, intArg("concurrency", 6));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function mapRole(cricketDataRole) {
  const r = String(cricketDataRole || "").trim().toLowerCase();
  if (!r) return null;
  if (r.includes("wk")) return "WK";
  if (r.includes("batsman")) return "BAT";
  if (r.includes("bowler")) return "BOWL";
  if (r.includes("allrounder") || r.includes("all-rounder")) return "ALL";
  return null;
}

function buildQueryVariants(name) {
  const base = String(name ?? "").trim();
  const variants = [base];
  const noDots = base.replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (noDots && noDots !== base) variants.push(noDots);

  // If the name starts with an initial, also try dropping it: "R Sai Kishore" -> "Sai Kishore".
  const dropInitial = noDots.replace(/^[A-Z]\s+/, "").trim();
  if (dropInitial && dropInitial !== noDots) variants.push(dropInitial);

  // Common short/long first-name variants we see in IPL pools.
  variants.push(
    base
      .replace(/\bMohammad\b/i, "Mohammed")
      .replace(/\bPhil\b/i, "Philip")
      .replace(/\bChakravarthy\b/i, "Chakaravarthy"),
  );
  variants.push(
    noDots
      .replace(/\bMohammad\b/i, "Mohammed")
      .replace(/\bPhil\b/i, "Philip")
      .replace(/\bChakravarthy\b/i, "Chakaravarthy"),
  );
  variants.push(
    dropInitial
      .replace(/\bMohammad\b/i, "Mohammed")
      .replace(/\bPhil\b/i, "Philip")
      .replace(/\bChakravarthy\b/i, "Chakaravarthy"),
  );

  // Initials sometimes appear without punctuation on cricketdata.
  // e.g. "T. Natarajan" => "T Natarajan" already covered by noDots, but keep deterministic ordering.
  const uniq = [];
  const seen = new Set();
  for (const v of variants) {
    const s = String(v ?? "").trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(s);
  }
  return uniq;
}

function extractFirstMatch(html, playerName) {
  // cricketdata.org renders player cards in HTML like:
  //   <span ...>Batsman</span>
  //   <h6 ...>Virat Kohli</h6>
  //   ...
  //   <th>Country</th><td>India</td>
  const low = html.toLowerCase();
  const nameNeedle = `>${playerName.toLowerCase()}<`;
  const idx = low.indexOf(nameNeedle);
  if (idx < 0) return null;
  const slice = html.slice(Math.max(0, idx - 2000), idx + 2500);

  const roleMatch = slice.match(/<span[^>]*>\s*([A-Za-z- ]+)\s*<\/span>\s*<h6[^>]*>\s*[^<]*<\/h6>/i);
  const countryMatch = slice.match(/<th>\s*Country\s*<\/th>\s*<td>\s*([^<]+?)\s*<\/td>/i);
  const detailsMatch = slice.match(/<a[^>]+href="([^"]+)"[^>]*>\s*Player Details\s*<\/a>/i);

  const roleRaw = roleMatch?.[1]?.trim() ?? "";
  const country = countryMatch?.[1]?.trim() ?? "";
  const href = detailsMatch?.[1]?.trim() ?? "";
  const detailsUrl = href.startsWith("http") ? href : href ? `https://cricketdata.org${href}` : "";
  return { roleRaw, country, detailsUrl };
}

async function fetchMetaForName(name) {
  const variants = buildQueryVariants(name);
  let lastErr = null;
  let lastUrl = "";
  for (const qv of variants) {
    const q = encodeURIComponent(qv);
    const searchUrl = `https://cricketdata.org/cricket-data-formats/players?search=${q}`;
    lastUrl = searchUrl;
    const res = await fetch(searchUrl, { headers: { "user-agent": "bidly/1.0 (one-time enrichment)" } });
    if (!res.ok) {
      lastErr = { ok: false, error: `HTTP ${res.status}`, searchUrl };
      continue;
    }
    const html = await res.text();
    const parsed = extractFirstMatch(html, qv);
    if (!parsed) {
      lastErr = { ok: false, error: "No exact match block found", searchUrl };
      continue;
    }
    const role = mapRole(parsed.roleRaw);
    if (!role) {
      lastErr = { ok: false, error: `Unmapped role: ${parsed.roleRaw}`, searchUrl, detailsUrl: parsed.detailsUrl };
      continue;
    }
    if (!parsed.country) {
      lastErr = { ok: false, error: "Missing country", searchUrl, detailsUrl: parsed.detailsUrl };
      continue;
    }
    return {
      ok: true,
      nationality: parsed.country,
      role,
      detailsUrl: parsed.detailsUrl || searchUrl,
      searchUrl,
      matched_query: qv,
    };
  }
  return lastErr ?? { ok: false, error: "No exact match block found", searchUrl: lastUrl };
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  let query = supabase.from("players").select("id, name, sport_id").eq("sport_id", sportId).order("name");
  if (limit > 0) query = query.range(offset, offset + limit - 1);
  else if (offset > 0) query = query.range(offset, offset + 9999);

  const { data: players, error } = await query;
  if (error) throw error;
  const list = players ?? [];
  console.log(`Loaded ${list.length} players for ${sportId}`);

  const results = [];
  const misses = [];

  let i = 0;
  async function worker() {
    while (i < list.length) {
      const idx = i++;
      const p = list[idx];
      const name = (p?.name ?? "").trim();
      if (!name) continue;
      try {
        const meta = await fetchMetaForName(name);
        if (!meta.ok) {
          misses.push({ id: p.id, name, ...meta });
          continue;
        }
        const is_overseas = meta.nationality.trim().toLowerCase() !== "india";
        results.push({
          id: p.id,
          name,
          nationality: meta.nationality,
          role: meta.role,
          is_overseas,
          source_url: meta.detailsUrl,
        });
      } catch (e) {
        misses.push({ id: p.id, name, ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, list.length || 1) }, () => worker()));

  results.sort((a, b) => a.name.localeCompare(b.name));
  const header = ["id", "name", "nationality", "role", "is_overseas", "source_url"].join(",");
  const lines = [header, ...results.map((r) => [r.id, r.name, r.nationality, r.role, r.is_overseas, r.source_url].map(csvEscape).join(","))];

  const fullOut = path.resolve(process.cwd(), outPath);
  await fs.mkdir(path.dirname(fullOut), { recursive: true });
  await fs.writeFile(fullOut, lines.join("\n") + "\n", "utf8");

  const missPath = fullOut.replace(/\.csv$/i, ".misses.json");
  await fs.writeFile(missPath, JSON.stringify({ sportId, count: misses.length, misses }, null, 2) + "\n", "utf8");

  console.log(`Wrote ${results.length} rows -> ${outPath}`);
  console.log(`Misses: ${misses.length} -> ${path.relative(process.cwd(), missPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

