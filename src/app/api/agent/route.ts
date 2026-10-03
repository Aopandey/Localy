import { readStore } from "@/server/agent-store";
import { requireWorkspaceMember } from "@/server/workspace-auth";

/** Everything the Agent page shows: tasks and leads, newest first. */
export async function GET(request: Request) {
  const denied = await requireWorkspaceMember(request);
  if (denied) return denied;
  const { tasks, leads } = await readStore();
  return Response.json(
    {
      tasks: [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      leads,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
