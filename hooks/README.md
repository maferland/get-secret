# Optional hook: nudge-keyhole

A `Stop` hook that watches the agent's last message. If it's asking the user to
paste a secret into the chat (and hasn't already reached for keyhole), it blocks
the turn with a reminder to run `keyhole <NAME>` instead. Loop-guarded via
`stop_hook_active`; zero dependencies; runs under node or bun.

It is **opt-in** — installing the plugin does not enable it. Wire it up yourself.

## Enable

Add to `~/.claude/settings.json` (or a project `.claude/settings.json`):

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$HOME/dev/keyhole/hooks/nudge-keyhole.mjs\""
          }
        ]
      }
    ]
  }
}
```

Installed as a plugin? Point at the plugin root instead:

```json
"command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/nudge-keyhole.mjs\""
```

## Behavior

- Matches phrasings like "paste your API key", "what's your token", "send me the
  secret", "your password here". Conservative by design — it won't fire on every
  mention of "key".
- Skips if the message already mentions `keyhole`.
- On a match it returns `{"decision":"block","reason":"…"}`, so the agent
  reconsiders and captures the secret via keyhole rather than waiting for a paste.
- False positive? The reason tells the agent to disregard if it wasn't soliciting
  a secret, so a stray match costs one extra turn, nothing more.
