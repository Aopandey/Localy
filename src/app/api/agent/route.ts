import { readStore } from "@/server/agent-store";
import { requireWorkspaceMember } from "@/server/workspace-auth";
import { agentRuntime } from "@/server/agent-runtime";

/** Everything the Agent page shows: tasks and leads, newest first. */
export async function GET(request: Request) {
  const denied = await requireWorkspaceMember(request);
  if (denied) return denied;
  const runtime = agentRuntime();
  const { tasks, leads } = runtime.available
    ? await readStore()
    : { tasks: [], leads: [] };
  return Response.json(
    {
      tasks: [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      leads,
      ...runtime,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
