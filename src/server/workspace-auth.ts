import { createClient } from "@supabase/supabase-js";

/** Apply the private workspace boundary to server routes in Supabase mode. */
export async function requireWorkspaceMember(
  request: Request,
): Promise<Response | null> {
  if (process.env.NEXT_PUBLIC_DATA_MODE !== "supabase") return null;
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (\S+)$/i)?.[1];
  const deny = (error: string, status: number) =>
    Response.json(
      { error },
      {
        status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  if (!token) return deny("Sign in to access this Localy workspace.", 401);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_"))
    return deny("Workspace authentication is not configured.", 503);
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          }),
      },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user)
      return deny("Your sign-in has expired. Please sign in again.", 401);
    const { data, error } = await supabase
      .from("localy_members")
      .select("user_id")
      .eq(
        "workspace_id",
        process.env.NEXT_PUBLIC_SUPABASE_WORKSPACE_ID || "localy",
      )
      .eq("user_id", user.id)
      .limit(1);
    if (error)
      return deny("Could not verify workspace access. Please retry.", 503);
    if (!data?.length)
      return deny(
        "Your account has not been added to this Localy workspace.",
        403,
      );
    return null;
  } catch {
    return deny("Could not verify workspace access. Please retry.", 503);
  }
}
