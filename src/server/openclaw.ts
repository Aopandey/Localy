import { spawn } from "node:child_process";
import { mkdirSync, openSync, readFileSync } from "node:fs";
import path from "node:path";
import type { AgentTask } from "@/lib/types/agent";
import { STORE_PATH, updateStore } from "./agent-store";

const OPENCLAW_BIN = process.env.OPENCLAW_BIN ?? "/opt/homebrew/bin/openclaw";
// Nemotron skipped tool calls in our tests, so tasks default to Claude until the GB10 model is tuned.
const MODEL = process.env.LOCALY_AGENT_MODEL ?? "anthropic/claude-opus-5-5";
const LOG_DIR = path.join(path.dirname(STORE_PATH), "logs");

function instructions(task: AgentTask) {
  const what =
    task.kind === "send"
      ? `Post the owner-approved reply for lead ${task.leadId}.`
      : task.kind === "search"
        ? `Search the web and find leads: ${task.query}`
        : `Watch this page and find leads: ${task.target}`;
  return [
    `Localy task ${task.id} (kind: ${task.kind}). ${what}`,
    `Follow the localy-outreach skill exactly. Start by reading the task and business with localy_store.py.`,
    task.kind === "send"
      ? "Post only the approved text, once. Then run mark-sent and task-update."
      : "READ-ONLY: never post, comment, react, or message during this task. Save leads with add-lead, then task-update.",
  ].join("\n");
}

/** Start an OpenClaw agent run for a task. Returns immediately; the agent updates the store. */
export function runTask(task: AgentTask) {
  mkdirSync(LOG_DIR, { recursive: true });
  const log = openSync(path.join(LOG_DIR, `${task.id}.log`), "a");
  const child = spawn(
    OPENCLAW_BIN,
    [
      "agent",
      "--session-id",
      `localy-${task.id}`,
      "--model",
      MODEL,
      "--timeout",
      "900",
      "--message",
      instructions(task),
    ],
    {
      detached: true,
      stdio: ["ignore", log, log],
      env: {
        ...process.env,
        LOCALY_STORE: STORE_PATH,
        PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`,
      },
    },
  );
  child.unref();
  child.on("exit", (code) => {
    // The agent normally marks the task itself; this catches crashes and timeouts.
    const tail = readFileSync(path.join(LOG_DIR, `${task.id}.log`), "utf8")
      .split("\n")
      .filter((l) => l.trim() && !/ExperimentalWarning|trace-warnings|Retrying with/.test(l))
      .slice(-3)
      .join(" ");
    void updateStore((data) => {
      const t = data.tasks.find((x) => x.id === task.id);
      if (!t || t.status === "done" || t.status === "failed") return;
      t.status = code === 0 ? "done" : "failed";
      t.summary = t.summary ?? (tail.slice(0, 400) || `Agent exited with code ${code}`);
      t.finishedAt = new Date().toISOString();
      if (t.kind === "send" && t.leadId) {
        const lead = data.leads.find((l) => l.id === t.leadId);
        if (lead?.status === "sending") lead.status = code === 0 ? "sent" : "failed";
      }
    });
  });
}
