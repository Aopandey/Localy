import { updateStore } from "@/server/agent-store";

/** Ignore a lead, or bring it back. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/agent/leads/[id]">) {
  const { id } = await ctx.params;
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (status !== "ignored" && status !== "new")
    return Response.json({ error: "Status must be ignored or new." }, { status: 400 });
  const lead = await updateStore((data) => {
    const l = data.leads.find((x) => x.id === id);
    if (!l || l.status === "sending" || l.status === "sent") return l ?? null;
    l.status = status;
    return l;
  });
  if (!lead) return Response.json({ error: "Lead not found." }, { status: 404 });
  return Response.json(lead);
}
