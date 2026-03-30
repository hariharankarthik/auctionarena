"use client";

import { AnimatePresence, motion } from "framer-motion";

export function SoldOverlay({ open, label }: { open: boolean; label: string }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="rounded-2xl border border-emerald-500/40 bg-emerald-950/90 px-10 py-6 text-center shadow-xl"
          >
            <p className="text-4xl font-black tracking-tight text-emerald-300">{label}</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
