# U0 Capability Validation Spike

You are validating whether this `claude-code-action` runtime can support the weekly AI reinvention cycle architecture described in `docs/plans/2026-06-01-001-feat-weekly-ai-reinvention-plan.md`. The cycle depends on a handful of specific capabilities being available inside the action's session. This spike tests each one and writes a structured report.

**Cost target: ≤ $2 worth of tokens.** Don't elaborate, don't research. Run the checks, record results, exit.

## Run order

Perform each check in order. Record `pass` / `fail` / `skipped` plus a short note. Do not abort on individual failures — record the failure and continue so the report is complete.

### Check 1: `Write` tool

Write a short file to `/tmp/spike-write-test.txt` containing the string `"spike write ok"`. Then read it back and verify the content matches. Record: `write_tool: pass | fail` + the content read.

### Check 2: `Bash` tool

Run the bash command `echo "spike bash ok" && pwd && ls -la .github/workflows/`. Record:
- `bash_tool: pass | fail`
- The current working directory
- Whether the workflows directory listing succeeded

### Check 3: `Agent` (subagent spawning) tool

Spawn a single subagent with the `Agent` tool. Give it the trivial task: "Return the string `subagent ok` and nothing else." Use the `general-purpose` subagent type. Record:
- `agent_tool: pass | fail`
- The subagent's returned message
- Whether you received structured output (so the orchestrator can pass critique data between Author and Editor in the real cycle)

### Check 4: `/last30days` skill

Try to invoke the `/last30days` skill via the `Skill` tool with a simple query like: `"trending tech news this week"`. Time window does not matter — just confirm whether the skill is invocable in this runtime. Record:
- `last30days_skill: pass | fail | unavailable`
- If unavailable, the exact error message

### Check 5: `WebSearch` fallback

Try a `WebSearch` tool call: search for `"Hacker News front page 2026"` (or any benign tech query). The query doesn't need to return useful results — we're testing whether the tool is callable. Record:
- `websearch_tool: pass | fail | unavailable`
- The number of results returned (or the error)

### Check 6: `WebFetch` fallback

Try a `WebFetch` tool call against `https://news.ycombinator.com/` with prompt `"Return the title of the page"`. Record:
- `webfetch_tool: pass | fail | unavailable`

### Check 7: Token usage observability

The orchestrator wants to know post-cycle token spend (DC9 in the plan). Determine whether you, as the cycle's main Claude session, can introspect total tokens consumed up to this point. If not, that's expected — the plan already pivots cost-cap enforcement to `--max-turns` + wall-clock. Record:
- `token_usage_observable: pass | partial | unavailable`
- The actual numbers if observable, or the reason if not

## Write the report

After all 7 checks, write two files to the repo root:

1. `spike-report.json` — structured machine-readable result:

```json
{
  "spike_run_at": "<ISO timestamp; you can ask Bash for `date -Iseconds`>",
  "claude_code_action_version": "v1",
  "checks": {
    "write_tool": "pass",
    "bash_tool": "pass",
    "agent_tool": "pass",
    "last30days_skill": "pass | unavailable",
    "websearch_tool": "pass | unavailable",
    "webfetch_tool": "pass | unavailable",
    "token_usage_observable": "partial | unavailable"
  },
  "p0_capabilities_pass": true,
  "p1_capabilities_pass": true,
  "notes": "<any blocker or surprise to surface to the team>"
}
```

P0 capabilities are: `write_tool`, `bash_tool`, `agent_tool`. If any of these fail, set `p0_capabilities_pass: false` and the spike fails — the cycle architecture cannot be built on this runtime without changes.

P1 capabilities are: at least one of {`last30days_skill`, `websearch_tool`} must pass for the topical fetcher to work. WebFetch is a bonus.

2. `spike-report.md` — human-readable summary suitable for pasting into a PR or issue. Include:
   - Pass/fail per check
   - Specific failure modes for anything that didn't work
   - One-paragraph recommendation: "Proceed to U1" / "Architecture revision needed: <reason>" / "Proceed with reduced scope: topical fetcher disabled"

## Important constraints

- Do NOT modify any source files in the repo. Read-only on the codebase.
- Do NOT commit or push anything. Outputs go to repo-root files which the workflow uploads as artifacts.
- Do NOT run the cycle's real orchestrator or any prompt under `scripts/cycle/prompts/*` — those don't exist yet and aren't part of the spike.
- Stop after writing the two report files. No additional exploration.
