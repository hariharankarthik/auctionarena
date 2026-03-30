import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 6): string {
  let out = "";
  const cryptoObj = globalThis.crypto;
  for (let i = 0; i < length; i++) {
    const n = cryptoObj.getRandomValues(new Uint8Array(1))[0]! % INVITE_CHARS.length;
    out += INVITE_CHARS[n]!;
  }
  return out;
}

export function formatCurrencyLakhsToCr(lakhs: number, symbol = "₹"): string {
  const cr = lakhs / 100;
  return `${symbol}${cr.toFixed(2)} Cr`;
}
