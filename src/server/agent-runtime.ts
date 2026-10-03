// The local OpenClaw process and file store require the teammate's computer.
// Vercel hosts the dashboard; it must not attempt to start that local process.
export function agentRuntime() {
  const available = process.env.VERCEL !== "1";
  return {
    available,
    message: available
      ? null
      : "The discovery agent runs on your teammate’s computer. Connect it to this site to run searches and send approved replies.",
  };
}
export function requireAgentRuntime(): Response | null {
  const runtime = agentRuntime();
  return runtime.available
    ? null
    : Response.json({ error: runtime.message }, { status: 503 });
}
