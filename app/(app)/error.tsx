"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  async function copyDetails() {
    const details = [
      "Bidly error",
      error.digest ? `digest: ${error.digest}` : null,
      error.message ? `message: ${error.message}` : null,
      error.stack ? `stack:\n${error.stack}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(details);
      toast.success("Error details copied");
    } catch {
      toast.error("Couldn’t copy error details");
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
      <p className="text-sm text-neutral-400">{error.message || "An unexpected error occurred."}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button type="button" variant="secondary" onClick={() => void copyDetails()}>
          Copy error details
        </Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
