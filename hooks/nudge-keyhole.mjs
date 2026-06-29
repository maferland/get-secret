#!/usr/bin/env node
// Optional Stop hook — if the agent's last message asks the user to paste a secret,
// nudge it to use keyhole instead. Opt-in via settings.json (see hooks/README.md).
import { readFileSync } from "node:fs"

const SOLICITS = [
  /\bpaste\b.{0,40}\b(api[\s-]?key|token|secret|password|credential|access[\s-]?key)\b/i,
  /\b(what(?:'s| is)|enter|provide|share|send|give me|drop)\b.{0,40}\b(api[\s-]?key|token|secret|password|credential)\b/i,
  /\byour\b.{0,20}\b(api[\s-]?key|token|secret|password|credential)\b.{0,30}\b(here|in (?:the )?chat|below)\b/i,
]

function lastAssistantText(transcriptPath) {
  let text = ""
  for (const line of readFileSync(transcriptPath, "utf8").split("\n")) {
    if (!line.trim()) continue
    let event
    try {
      event = JSON.parse(line)
    } catch {
      continue
    }
    const msg = event.message ?? event
    const role = msg.role ?? event.type
    if (role !== "assistant") continue
    const content = msg.content
    if (typeof content === "string") text = content
    else if (Array.isArray(content))
      text = content
        .filter((b) => b?.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("\n")
  }
  return text
}

function main() {
  let input
  try {
    input = JSON.parse(readFileSync(0, "utf8"))
  } catch {
    process.exit(0)
  }
  if (input.stop_hook_active) process.exit(0) // don't re-trigger ourselves
  if (!input.transcript_path) process.exit(0)

  let text = ""
  try {
    text = lastAssistantText(input.transcript_path)
  } catch {
    process.exit(0)
  }
  if (!text || /keyhole/i.test(text)) process.exit(0)
  if (!SOLICITS.some((re) => re.test(text))) process.exit(0)

  const reason =
    "You appear to be asking the user to paste a secret into the chat — that puts it " +
    "in your context, the transcript, and any logs. Use keyhole instead: run " +
    "`keyhole <NAME> --context '<what it is for>'` (or `npx keyhole <NAME>`). It opens a " +
    "localhost form; the value goes to a store (Keychain/file/env) and you get back only a " +
    "reference (`retrieve`) to expand at runtime. Pass multiple names for several secrets. " +
    "If you were not soliciting a secret, disregard this."
  process.stdout.write(JSON.stringify({ decision: "block", reason }))
  process.exit(0)
}

main()
