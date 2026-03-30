import { Navbar } from "@/components/app/navbar";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="aa-app-shell min-h-[calc(100vh-3.5rem)] text-neutral-100 outline-none"
      >
        {children}
      </main>
    </>
  );
}
