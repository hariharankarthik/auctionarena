import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const q = await searchParams;
  const nextPath = q.next?.startsWith("/") ? q.next : "/dashboard";
  return <LoginForm nextPath={nextPath} />;
}
