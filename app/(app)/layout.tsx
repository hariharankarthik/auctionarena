import { Navbar } from "@/components/app/navbar";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-3.5rem)] bg-neutral-950 text-neutral-100">{children}</div>
    </>
  );
}
