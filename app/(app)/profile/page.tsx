import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="mx-auto max-w-lg p-6">
      <Card className="border-neutral-800">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-neutral-300">
          <p>
            <span className="text-neutral-500">Email</span> · {user?.email ?? "—"}
          </p>
          <p>
            <span className="text-neutral-500">Username</span> · {profile?.username ?? "—"}
          </p>
          <p>
            <span className="text-neutral-500">Display name</span> · {profile?.display_name ?? "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
