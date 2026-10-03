import type { Business } from "@/lib/types";
import type { AgentTask } from "@/lib/types/agent";
import { updateStore } from "@/server/agent-store";
import { runTask } from "@/server/openclaw";
import { requireWorkspaceMember } from "@/server/workspace-auth";

/** Start a discovery task: watch a page, or search the web. */
export async function POST(request: Request) {
  const denied = await requireWorkspaceMember(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    target?: string;
    query?: string;
    business?: Business;
  };
  const target = body.target?.trim() ?? "";
  const query = body.query?.trim() ?? "";
  if (body.kind === "watch_url" && !/^https?:\/\/\S+$/i.test(target))
    return Response.json(
      { error: "Enter a full link, starting with https://" },
      { status: 400 },
    );
  if (body.kind === "search" && (query.length < 3 || query.length > 300))
    return Response.json(
      { error: "Enter a search between 3 and 300 characters." },
      { status: 400 },
    );
  if (body.kind !== "watch_url" && body.kind !== "search")
    return Response.json(
      { error: "Choose watch a page or search the web." },
      { status: 400 },
    );
  if (!body.business?.name)
    return Response.json(
      { error: "Business profile is missing." },
      { status: 400 },
    );

  const task = await updateStore((data) => {
    if (data.tasks.some((t) => t.status === "running" || t.status === "queued"))
      return null;
    const created: AgentTask = {
      id: `task_${crypto.randomUUID().slice(0, 8)}`,
      kind: body.kind as AgentTask["kind"],
      ...(body.kind === "watch_url" ? { target } : { query }),
      status: "running",
      createdAt: new Date().toISOString(),
    };
    data.business = body.business!;
    data.tasks.push(created);
    return created;
  });
  if (!task)
    return Response.json(
      {
        error: "The agent is already working on a task. Wait for it to finish.",
      },
      { status: 409 },
    );
  runTask(task);
  return Response.json(task, { status: 201 });
}
