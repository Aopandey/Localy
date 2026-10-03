import type { AgentTask } from "@/lib/types/agent";
import { updateStore } from "@/server/agent-store";
import { runTask } from "@/server/openclaw";

/** Owner approved a reply: have the agent post exactly this text through Aside. */
export async function POST(request: Request, ctx: RouteContext<"/api/agent/leads/[id]/send">) {
  const { id } = await ctx.params;
  const { response } = (await request.json().catch(() => ({}))) as { response?: string };
  const text = response?.trim() ?? "";
  if (text.length < 10 || text.length > 1500)
    return Response.json({ error: "Write a reply between 10 and 1,500 characters." }, { status: 400 });

  const result = await updateStore((data) => {
    const lead = data.leads.find((l) => l.id === id);
    if (!lead) return { error: "Lead not found.", status: 404 };
    if (lead.status !== "new" && lead.status !== "failed")
      return { error: `This lead is already ${lead.status}.`, status: 409 };
    if (data.tasks.some((t) => t.status === "running" || t.status === "queued"))
      return { error: "The agent is busy. Send again when the current task finishes.", status: 409 };
    lead.status = "sending";
    lead.suggestedResponse = text;
    const task: AgentTask = {
      id: `task_${crypto.randomUUID().slice(0, 8)}`,
      kind: "send",
      leadId: id,
      approvedResponse: text,
      status: "running",
      createdAt: new Date().toISOString(),
    };
    data.tasks.push(task);
    return { task };
  });
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  runTask(result.task);
  return Response.json(result.task, { status: 201 });
}
