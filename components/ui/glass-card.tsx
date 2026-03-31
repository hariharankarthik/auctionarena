import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-lg shadow-black/20",
        hover && "transition-all duration-300 hover:bg-white/8 hover:border-white/20 hover:shadow-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

