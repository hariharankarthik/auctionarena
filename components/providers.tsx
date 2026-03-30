"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors theme="dark" position="top-center" closeButton className="font-sans" />
    </>
  );
}
