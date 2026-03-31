"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PlayerMetaInput = {
  role?: string | null;
  nationality?: string | null;
  isOverseas?: boolean | null;
};

function flagForNationality(nationality: string | null | undefined): string | null {
  const raw = (nationality ?? "").trim();
  if (!raw) return null;
  const n = raw.toLowerCase();
  const map: Record<string, string> = {
    india: "🇮🇳",
    australia: "🇦🇺",
    england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "south africa": "🇿🇦",
    "new zealand": "🇳🇿",
    afghanistan: "🇦🇫",
    "west indies": "🏝️",
    "sri lanka": "🇱🇰",
    bangladesh: "🇧🇩",
    ireland: "🇮🇪",
    scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    netherlands: "🇳🇱",
    "united states of america": "🇺🇸",
    nepal: "🇳🇵",
    zimbabwe: "🇿🇼",
    pakistan: "🇵🇰",
    "united arab emirates": "🇦🇪",
  };
  return map[n] ?? "🌍";
}

function emojiForRole(role: string | null | undefined): string | null {
  switch ((role ?? "").trim().toUpperCase()) {
    case "BAT":
      return "🏏";
    case "BOWL":
      return "🎯";
    case "ALL":
      return "🏏🎯";
    case "WK":
      return "🧤";
    default:
      return null;
  }
}

export function PlayerMeta({
  role,
  nationality,
  isOverseas,
  variant = "badge",
  className,
}: PlayerMetaInput & {
  variant?: "badge" | "inline";
  className?: string;
}) {
  const flag = flagForNationality(nationality);
  const roleEmoji = emojiForRole(role);
  const airplane = isOverseas ? "✈️" : null;

  const parts = [flag, roleEmoji, airplane].filter(Boolean).join(" ");
  if (!parts) return null;

  if (variant === "inline") {
    return (
      <span className={cn("text-sm text-neutral-400", className)} aria-hidden>
        {parts}
      </span>
    );
  }

  return (
    <Badge variant="outline" className={cn("shrink-0 border-white/10 text-neutral-300", className)}>
      {parts}
    </Badge>
  );
}

