import { safeNextPath } from "@/lib/safe-path";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const q = await searchParams;
  const nextPath = safeNextPath(q.next, "/dashboard");
  return <LoginForm nextPath={nextPath} />;
}
