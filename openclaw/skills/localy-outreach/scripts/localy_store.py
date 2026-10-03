#!/usr/bin/env python3
"""Shared store between the OpenClaw agent and the Localy website.

The website creates tasks and shows leads; the agent saves what it finds here.
Every command prints JSON.

  localy_store.py business                 print the business profile the owner set in Localy
  localy_store.py task <task id>           print one task (what the owner asked for)
  localy_store.py task-update '<json>'     {"id", "status": running|done|failed, "summary"}
  localy_store.py add-lead '<json>'        save a lead found during a discovery task
  localy_store.py lead <lead id>           print one lead (used when sending)
  localy_store.py mark-sent '<json>'       {"id", "ok": true|false, "note", "replyUrl"}
"""
import json
import os
import shutil
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

STORE = Path(os.environ.get("LOCALY_STORE", Path.home() / "GB10/Localy/data/agent-store.json"))
LOCK = STORE.with_suffix(".lock")
EMPTY = {"business": None, "tasks": [], "leads": []}


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def out(obj):
    print(json.dumps(obj, indent=2))


class locked:
    """Directory lock shared with the Next.js side (src/server/agent-store.ts)."""

    def __enter__(self):
        for _ in range(100):
            try:
                LOCK.mkdir()
                return
            except FileExistsError:
                if time.time() - LOCK.stat().st_mtime > 15:
                    shutil.rmtree(LOCK, ignore_errors=True)
                time.sleep(0.1)
        raise TimeoutError("store is locked")

    def __exit__(self, *exc):
        shutil.rmtree(LOCK, ignore_errors=True)


def read():
    try:
        return {**EMPTY, **json.loads(STORE.read_text())}
    except (FileNotFoundError, json.JSONDecodeError):
        return dict(EMPTY)


def write(data):
    STORE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STORE.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.replace(STORE)


def find(items, item_id):
    item = next((i for i in items if i["id"] == item_id), None)
    if item is None:
        raise KeyError(f"no item with id {item_id}")
    return item


def cmd_business():
    out(read()["business"])


def cmd_task(task_id):
    out(find(read()["tasks"], task_id))


def cmd_task_update(payload):
    p = json.loads(payload)
    with locked():
        data = read()
        task = find(data["tasks"], p["id"])
        task.update({k: v for k, v in p.items() if k in ("status", "summary")})
        if p.get("status") in ("done", "failed"):
            task["finishedAt"] = now()
        write(data)
    out({"ok": True, "task": task})


def cmd_add_lead(payload):
    p = json.loads(payload)
    for field in ("taskId", "url", "postText", "suggestedResponse"):
        if not p.get(field):
            raise ValueError(f"lead is missing {field}")
    with locked():
        data = read()
        dup = next((l for l in data["leads"]
                    if l["url"] == p["url"] and l.get("author") == p.get("author")), None)
        if dup:
            out({"ok": True, "duplicate": True, "lead": dup})
            return
        lead = {
            "id": "lead_" + uuid.uuid4().hex[:8],
            "source": "Web",
            "community": "",
            "author": "",
            "postedAt": "",
            "intent": {},
            "match": {"score": 0, "checks": []},
            "replyChannel": "comment",
            "dmInvited": False,
            **p,
            "status": "new",
            "detectedAt": now(),
        }
        # A DM is only allowed when the poster asked for one.
        if lead["replyChannel"] == "dm" and not lead["dmInvited"]:
            lead["replyChannel"] = "comment"
        data["leads"].insert(0, lead)
        write(data)
    out({"ok": True, "lead": lead})


def cmd_lead(lead_id):
    out(find(read()["leads"], lead_id))


def cmd_mark_sent(payload):
    p = json.loads(payload)
    with locked():
        data = read()
        lead = find(data["leads"], p["id"])
        lead["status"] = "sent" if p.get("ok") else "failed"
        lead["sentNote"] = p.get("note", "")
        lead["replyUrl"] = p.get("replyUrl", "")
        lead["sentAt"] = now()
        write(data)
    out({"ok": True, "lead": lead})


if __name__ == "__main__":
    cmds = {"business": cmd_business, "task": cmd_task, "task-update": cmd_task_update,
            "add-lead": cmd_add_lead, "lead": cmd_lead, "mark-sent": cmd_mark_sent}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        print(__doc__)
        sys.exit(1)
    try:
        cmds[sys.argv[1]](*sys.argv[2:])
    except (KeyError, ValueError, TypeError, TimeoutError, json.JSONDecodeError) as e:
        out({"ok": False, "error": f"{type(e).__name__}: {e}"})
        sys.exit(1)
