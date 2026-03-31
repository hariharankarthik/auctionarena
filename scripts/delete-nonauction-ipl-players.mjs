#!/usr/bin/env node
/**
 * Delete players for a sport_id that are NOT in the Cricbuzz auction list,
 * but only if they are not referenced by any app tables.
 *
 * Safe-by-default: dry-run unless --apply true
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/delete-nonauction-ipl-players.mjs --sport ipl_2026 --auction-csv data/ipl_auction_cricbuzz_ipl_2026.csv
 *
 * To actually delete:
 *   ... node scripts/delete-nonauction-ipl-players.mjs --apply true ...
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

function boolArg(name, fallback = false) {
  const v = argValue(name, null);
  if (v == null) return fallback;
  return ["true", "1", "yes", "y"].includes(String(v).trim().toLowerCase());
}

const sportId = argValue("sport", "ipl_2026");
const auctionCsvPath = argValue("auction-csv", `data/ipl_auction_cricbuzz_${sportId}.csv`);
const apply = boolArg("apply", false);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

function normalizeName(s) {
  return String(s ?? "").trim().replace(/\s+/g, " ");
}

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

async function countEq(table, col, value) {
  const { count, error } = await supabase.from(table).select(col, { count: "exact", head: true }).eq(col, value);
  if (error) throw error;
  return count ?? 0;
}

async function countArrayContains(table, col, id) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .contains(col, [id]);
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  const csv = await fs.readFile(auctionCsvPath, "utf8");
  const grid = parseCsv(csv.trim() + "\n");
  const headers = grid[0]?.map((h) => h.trim().toLowerCase()) ?? [];
  const nameIdx = headers.indexOf("name");
  if (nameIdx < 0) throw new Error(`auction csv missing 'name' column: ${auctionCsvPath}`);
  const auctionNames = new Set(
    grid
      .slice(1)
      .map((r) => normalizeName(r[nameIdx] ?? "").toLowerCase())
      .filter(Boolean),
  );
  console.log(`Auction list names: ${auctionNames.size}`);

  const { data: players, error } = await supabase
    .from("players")
    .select("id, name, sport_id")
    .eq("sport_id", sportId);
  if (error) throw error;
  const list = players ?? [];
  console.log(`Players in DB for ${sportId}: ${list.length}`);

  const extras = list.filter((p) => !auctionNames.has(normalizeName(p.name).toLowerCase()));
  console.log(`Extra players not in auction list: ${extras.length}`);
  if (!extras.length) return;

  const deletable = [];
  const blocked = [];

  for (const p of extras) {
    const pid = p.id;
    const refs = {
      auction_rooms_current: await countEq("auction_rooms", "current_player_id", pid),
      bids: await countEq("bids", "player_id", pid),
      auction_results: await countEq("auction_results", "player_id", pid),
      private_captain: await countEq("private_league_teams", "captain_player_id", pid),
      private_vc: await countEq("private_league_teams", "vice_captain_player_id", pid),
      private_squad: await countArrayContains("private_league_teams", "squad_player_ids", pid),
      private_xi: await countArrayContains("private_league_teams", "starting_xi_player_ids", pid),
    };
    const total = Object.values(refs).reduce((a, b) => a + b, 0);
    if (total > 0) blocked.push({ ...p, refs });
    else deletable.push(p);
  }

  console.log(`Deletable: ${deletable.length}`);
  console.log(`Blocked (referenced): ${blocked.length}`);

  if (blocked.length) {
    console.log("Blocked players:");
    for (const b of blocked.slice(0, 50)) {
      console.log(`- ${b.name} (${b.id.slice(0, 8)}…) refs=${JSON.stringify(b.refs)}`);
    }
    if (blocked.length > 50) console.log(`... +${blocked.length - 50} more`);
  }

  if (!apply) {
    console.log("Dry run only. Re-run with --apply true to delete deletable players.");
    console.log("Would delete:");
    for (const d of deletable) console.log(`- ${d.name} (${d.id.slice(0, 8)}…)`);
    return;
  }

  if (!deletable.length) {
    console.log("Nothing to delete.");
    return;
  }

  const ids = deletable.map((d) => d.id);
  const { error: delErr } = await supabase.from("players").delete().in("id", ids);
  if (delErr) throw delErr;
  console.log(`Deleted ${ids.length} players.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

