"use client";

import { useState } from "react";
import type { LeagueTeamDisplay } from "@/lib/sports/types";
import type { ScoreRow } from "@/hooks/useLeaderboard";

const dateFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

type PlayerLine = {
  player_name?: string;
  player_id?: string;
  base_pts?: number;
  base_points?: number;
  multiplier?: number;
  effective_pts?: number;
  effective_points?: number;
  stats?: {
    batting?: { runs?: number; ballsFaced?: number; fours?: number; sixes?: number; dismissed?: boolean };
    bowling?: { ballsBowled?: number; runsConceded?: number; wicketsExcludingRunOut?: number; maidens?: number; dotBalls?: number };
    fielding?: { catches?: number; stumpings?: number; runOutsDirect?: number; runOutsThrower?: number };
  };
  sections?: { batting?: Record<string, number>; bowling?: Record<string, number>; fielding?: Record<string, number> };
  breakdown?: Record<string, number>;
};

export function MatchBreakdown({ scores, teams, matchNames }: { scores: ScoreRow[]; teams: LeagueTeamDisplay[]; matchNames?: Record<string, string> }) {
  const names = new Map(teams.map((t) => [t.id, t.team_name]));

  // Group by date, then by match within each date
  const byDate = new Map<string, Map<string, ScoreRow[]>>();
  for (const s of scores) {
    if (!byDate.has(s.match_date)) byDate.set(s.match_date, new Map());
    const dateMap = byDate.get(s.match_date)!;
    if (!dateMap.has(s.match_id)) dateMap.set(s.match_id, []);
    dateMap.get(s.match_id)!.push(s);
  }
  const sortedDates = [...byDate.keys()].sort((a, b) => a.localeCompare(b));

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
      <h3 className="text-sm font-medium uppercase tracking-wide text-neutral-500">Match breakdown</h3>
      <div className="mt-3 space-y-5">
        {sortedDates.length === 0 ? (
          <p className="text-sm text-neutral-500">No match rows yet.</p>
        ) : (
          sortedDates.map((date) => {
            const matches = byDate.get(date)!;
            const dateLabel = dateFmt.format(new Date(date + "T00:00:00"));
            return (
              <div key={date}>
                <p className="text-xs font-semibold text-neutral-400">{dateLabel}</p>
                <div className="mt-2 space-y-3">
                  {[...matches.entries()].map(([mid, rows]) => (
                    <div key={mid} className="space-y-1">
                      <p className="text-xs text-neutral-500">{matchNames?.[mid] ?? `Match ${mid}`}</p>
                      <ul className="space-y-1 text-sm">
                        {rows.map((r) => (
                          <MatchScoreRow key={r.id} row={r} teamName={names.get(r.scoreboard_team_id) ?? r.scoreboard_team_id} />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function MatchScoreRow({ row, teamName }: { row: ScoreRow; teamName: string }) {
  const playerLines = (row.breakdown?.player_lines ?? null) as PlayerLine[] | null;
  const [open, setOpen] = useState(false);

  return (
    <li className="list-none">
      <div className="flex justify-between gap-2">
        <button
          type="button"
          className={`min-w-0 text-left ${playerLines ? "cursor-pointer hover:text-neutral-100" : "cursor-default"} text-neutral-300`}
          onClick={() => playerLines && setOpen((v) => !v)}
        >
          {teamName}
          {playerLines ? <span className="ml-1 text-xs text-neutral-500">{open ? "▾" : "▸"}</span> : null}
        </button>
        <span className="font-mono text-neutral-200">{Number(row.total_points).toFixed(1)}</span>
      </div>
      {open && playerLines ? (
        <div className="ml-4 mt-1 space-y-1 border-l border-neutral-800 pl-3">
          {playerLines.map((pl, i) => (
            <PlayerLineRow key={i} pl={pl} />
          ))}
        </div>
      ) : null}
    </li>
  );
}

function PlayerLineRow({ pl }: { pl: PlayerLine }) {
  const basePts = pl.base_pts ?? pl.base_points ?? 0;
  const effectivePts = pl.effective_pts ?? pl.effective_points ?? 0;
  const hasBreakdown = pl.breakdown && Object.keys(pl.breakdown).length > 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex justify-between gap-3 text-xs text-neutral-400">
        <button
          type="button"
          className={`min-w-0 truncate text-left ${hasBreakdown && basePts > 0 ? "cursor-pointer hover:text-neutral-200" : "cursor-default"}`}
          onClick={() => hasBreakdown && basePts > 0 && setExpanded((v) => !v)}
        >
          {pl.player_name ?? pl.player_id ?? "Unknown"}
          {hasBreakdown && basePts > 0 ? <span className="ml-1 text-neutral-600">{expanded ? "▾" : "▸"}</span> : null}
        </button>
        <span className="flex shrink-0 gap-2 font-mono">
          <span>{basePts.toFixed(1)}</span>
          <span className="text-neutral-500">×{pl.multiplier ?? 1}</span>
          <span className="text-neutral-200">{effectivePts.toFixed(1)}</span>
        </span>
      </div>
      {expanded && pl.stats ? (
        <div className="ml-3 mt-0.5 space-y-0.5 text-[11px] text-neutral-500">
          {pl.stats.batting && (pl.sections?.batting || pl.stats.batting.runs !== undefined) ? (
            <p>
              <span className="text-blue-400/70">BAT</span>{" "}
              {pl.stats.batting.runs ?? 0}({pl.stats.batting.ballsFaced ?? 0}){" "}
              {(pl.stats.batting.fours ?? 0) > 0 ? <span>{pl.stats.batting.fours}×4 </span> : null}
              {(pl.stats.batting.sixes ?? 0) > 0 ? <span>{pl.stats.batting.sixes}×6 </span> : null}
              {pl.sections?.batting ? (
                <span className="text-neutral-400">→ {Object.values(pl.sections.batting).reduce((a, b) => a + b, 0).toFixed(0)}pts</span>
              ) : null}
            </p>
          ) : null}
          {pl.stats.bowling && (pl.sections?.bowling || pl.stats.bowling.wicketsExcludingRunOut !== undefined) ? (() => {
            const b = pl.stats.bowling;
            const overs = Math.floor((b.ballsBowled ?? 0) / 6);
            const balls = (b.ballsBowled ?? 0) % 6;
            return (
              <p>
                <span className="text-green-400/70">BOWL</span>{" "}
                {overs}.{balls}-{b.runsConceded ?? 0}-{b.wicketsExcludingRunOut ?? 0}{" "}
                {(b.maidens ?? 0) > 0 ? <span>{b.maidens}M </span> : null}
                {pl.sections?.bowling ? (
                  <span className="text-neutral-400">→ {Object.values(pl.sections.bowling).reduce((a, b) => a + b, 0).toFixed(0)}pts</span>
                ) : null}
              </p>
            );
          })() : null}
          {pl.stats.fielding && pl.sections?.fielding && Object.values(pl.sections.fielding).some((v) => v > 0) ? (
            <p>
              <span className="text-amber-400/70">FIELD</span>{" "}
              {(pl.stats.fielding.catches ?? 0) > 0 ? <span>{pl.stats.fielding.catches}ct </span> : null}
              {(pl.stats.fielding.stumpings ?? 0) > 0 ? <span>{pl.stats.fielding.stumpings}st </span> : null}
              {(pl.stats.fielding.runOutsDirect ?? 0) > 0 ? <span>{pl.stats.fielding.runOutsDirect}ro </span> : null}
              <span className="text-neutral-400">→ {Object.values(pl.sections.fielding).reduce((a, b) => a + b, 0).toFixed(0)}pts</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
