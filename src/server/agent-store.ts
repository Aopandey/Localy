import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentStore } from "@/lib/types/agent";

// Shared with the OpenClaw skill script (agent/skills/localy-outreach/scripts/localy_store.py).
export const STORE_PATH =
  process.env.LOCALY_STORE ?? path.join(process.cwd(), "data", "agent-store.json");
const LOCK_PATH = STORE_PATH.replace(/\.json$/, ".lock");
const EMPTY: AgentStore = { business: null, tasks: [], leads: [] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  for (let i = 0; i < 100; i++) {
    try {
      await mkdir(LOCK_PATH);
      try {
        return await fn();
      } finally {
        await rm(LOCK_PATH, { recursive: true, force: true });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const lock = await stat(LOCK_PATH).catch(() => null);
      if (lock && Date.now() - lock.mtimeMs > 15_000)
        await rm(LOCK_PATH, { recursive: true, force: true });
      await sleep(100);
    }
  }
  throw new Error("The agent store is busy. Try again in a moment.");
}

export async function readStore(): Promise<AgentStore> {
  try {
    return { ...EMPTY, ...JSON.parse(await readFile(STORE_PATH, "utf8")) };
  } catch {
    return structuredClone(EMPTY);
  }
}

/** Read-modify-write under the shared lock. */
export async function updateStore<T>(fn: (data: AgentStore) => T): Promise<T> {
  return withLock(async () => {
    const data = await readStore();
    const result = fn(data);
    await mkdir(path.dirname(STORE_PATH), { recursive: true });
    const tmp = STORE_PATH.replace(/\.json$/, ".tmp");
    await writeFile(tmp, JSON.stringify(data, null, 2));
    await rename(tmp, STORE_PATH);
    return result;
  });
}
