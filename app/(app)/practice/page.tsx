import { PracticeSandbox } from "@/components/practice/PracticeSandbox";

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Practice vs AI</h1>
        <p className="text-sm text-neutral-500">
          Offline sandbox using the same bid rules and three AI styles (easy / medium / hard). Full timed practice
          rooms can reuse the live engine next.
        </p>
      </div>
      <PracticeSandbox />
    </div>
  );
}
