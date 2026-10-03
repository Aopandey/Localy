import { readStore } from "@/server/agent-store";

/** Everything the Agent page shows: tasks and leads, newest first. */
export async function GET() {
  const { tasks, leads } = await readStore();
  return Response.json({
    tasks: [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    leads,
  });
}
