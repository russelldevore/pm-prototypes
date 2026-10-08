# Fraud Case Investigation Agent — Prototype

A small, working prototype of an LLM agent that investigates a fraud case by deciding which data tools to call, then produces a risk summary with an escalate / review / clear recommendation.

> **Scope note:** This is a learning prototype built on **hand-written mock data**. Nothing here connects to a real rules engine, identity vendor, or production system, and it is not a decisioning system. It exists to explore how agents behave in a fraud-review workflow, and how a product manager should think about validating and governing one.

---

## Why I built this

I come from fraud decisioning and identity product work and wanted hands-on experience with how agents actually work, beyond reading about them. The goals were to:

1. Understand the mechanics (tool schemas, the request/tool-result loop, stop conditions).
2. See for myself whether a model makes real *tool-selection decisions* rather than running a scripted pipeline.
3. Practice the validation discipline that regulated environments require, starting with testing the wiring without spending any API tokens.

**Design stance:** the agent *augments* an existing decision process. It synthesizes and explains signals for a human reviewer; it does not make the final adverse-action decision.

---

## How it works

```
Prompt: "Investigate case C-1002"
        │
        ▼
  Model decides which tool to call  ──►  get_case_summary
        │                                      │
        │◄──────────── tool_result ────────────┘
        │
  Model decides whether more data is needed
        │            (only if the summary hints at an identity issue)
        ├──────────────────────────────►  get_identity_verification
        │◄──────────── tool_result ───────────┘
        ▼
  Final 3-point risk summary + recommendation
```

**Plain function vs. agent:** with one tool and one case, this is indistinguishable from a function call. The agent behavior only becomes visible with a real branch point, so the prototype has two tools and four cases designed so that not every case needs both tools.

| Case | Designed pattern | Expected behavior |
| :---- | :---- | :---- |
| C-1001 | Velocity/device reuse | Skips identity tool (signal already conclusive) |
| C-1002 | SSN-age mismatch, unverified employer | Calls identity tool |
| C-1003 | Clean control | One call, routine review |
| C-1004 | Velocity + identity concern, **identity record missing** | Calls identity tool, handles the failure |

---

## Project layout

```
fraud-case-agent/
├── agent.js              # Live agent loop (plan → act → observe)
├── tools.js              # Tool schemas the model reasons over
├── functions.js          # Mock implementations behind each tool
├── case-data.json        # Mock dataset
├── test-mock-agent.js    # Zero-cost validation harness (no API calls)
├── package.json
└── README.md
```

## Setup

```bash
npm install
# Provide your own key via environment variable. Never commit it.
export ANTHROPIC_API_KEY=<your-key-here>
```

Add a `.gitignore` before pushing (already included in this folder):

```
node_modules/
.env
```

## Run

```bash
# 1. Validate the orchestration logic for free (no key, no tokens)
node test-mock-agent.js
# 2. Run the real agent (costs a fraction of a cent per case)
node agent.js C-1001
node agent.js C-1002
node agent.js C-1003
node agent.js C-1004
```

---

## Validating without spending tokens (the WireMock-style layer)

Most of the script can be validated with no API call. The test harness feeds the orchestration code **hand-built fake responses** shaped like real `tool_use` blocks.

| Layer | What's tested | Needs a live API call? |
| :---- | :---- | :---- |
| Tool functions | Does `get_case_summary("C-1002")` return the right data? | No |
| Response parsing / dispatch | Given a fake tool request, does the code call the right function and link the result to the right `tool_use_id`? | No |
| Error handling | Hallucinated tool name? Nonexistent case ID? | No |
| Loop termination | Does the code recognize a final answer and stop? | No |
| Actual model behavior | Does the model really choose the identity tool on C-1002 and skip it on C-1001? | **Yes** |

Only the last row costs tokens. The rest, which is the orchestration logic, is covered by the 10 offline checks in `test-mock-agent.js`.

---

## Code

| File | What it does |
|---|---|
| [`case-data.json`](case-data.json) | Mock dataset. C-1004 deliberately has **no** identity record, to simulate a vendor/service failure. |
| [`tools.js`](tools.js) | Tool schemas the model reasons over. The tool `description` is what the model uses to decide *when* to call a tool, so writing it is a product decision as much as an engineering one. |
| [`functions.js`](functions.js) | Mock implementations behind each tool. In production, each body would call a rules engine or identity vendor; the tool schema would not change. |
| [`agent.js`](agent.js) | Live agent loop (plan → act → observe). Dispatch logic is pulled into small exported functions so the offline harness can test it, and `MAX_ITERATIONS` is a hard stop-condition guardrail. |
| [`test-mock-agent.js`](test-mock-agent.js) | Zero-cost validation harness: 10 checks against hand-built fake responses, no API key or network. |
| [`package.json`](package.json) | Single dependency: `@anthropic-ai/sdk`. |

---

## Live run results

Four cases were run against the live API. Total cost for all four was roughly a penny.

| Case | Tools called | Outcome |
| :---- | :---- | :---- |
| **C-1001** | `get_case_summary` only | Escalate. The model reasoned that the signal was velocity/device-driven with no identity inconsistency, and skipped the identity tool. |
| **C-1002** | `get_case_summary` → `get_identity_verification` | Escalate. The model connected the SSN issuance year (2019) to the stated age (45) as a contradiction without being told to do that math. |
| **C-1003** | `get_case_summary` only | Routine review. No unnecessary escalation or tool calls. |
| **C-1004** | `get_case_summary` → `get_identity_verification` (returned an error) | Escalate. The model named the failed lookup in its rationale and treated the missing data as a contributing risk. |

### What the runs surfaced

**1. Tool selection is visible, not scripted.** C-1001 vs. C-1002 is the clearest evidence: same agent, same prompt, different tool paths based on what the first result said.

**2. Fail-closed behavior on C-1004 was emergent, not engineered.** Nothing in the prompt or tool definitions said "treat a failed vendor call as elevated risk." The model inferred it from its role. That is the right default for fraud, but a behavior I observed once is not a guarantee. In production it would need to be an explicit, tested policy that distinguishes three states: *vendor returned clean*, *vendor call failed*, and *vendor flagged risk*.

**3. Presentation was inconsistent even though reasoning was sound.** On C-1001 the response used a red header but a green check next to "ESCALATE." The model generates formatting token by token, and nothing constrained it. This is a small, concrete example of why free-text output is unreliable for anything feeding a UI or downstream system.

---

## Backlog

**1. Structured output / decision matrix (highest priority).** Replace free-text answers with a forced schema so risk level and presentation are decoupled:

```json
{
  "risk_level": "escalate | review | clear",
  "data_completeness": "complete | incomplete",
  "rationale": "2-3 sentence explanation citing specific signals",
  "signals_cited": ["array", "of", "signal", "names"]
}
```

`data_completeness` is its own field so "we escalated despite a vendor failure" becomes queryable and auditable rather than buried in prose. Icons and colors would be owned by the UI layer reading the enum, never generated by the model. This is the same design pattern as score bands for a numeric risk score; the band boundaries should be a deliberate, documented policy decision. Implementation: add a final `submit_risk_assessment` tool with an enum-constrained schema that the agent must call last.

**2. Explicit vendor-failure policy.** Formalize the fail-closed behavior: if any tool call errors, `data_completeness` must be `incomplete` and `risk_level` may not be `clear`. Test with dedicated eval cases that force each tool to fail independently.

**3. More mock cases.**

- A suspicious-sounding summary where the identity tool comes back clean (does the model over-escalate on language alone?)
- A borderline case designed to land in a "review" middle tier
- A partial or slow tool response rather than a clean error
- A crypto-flavored case (wallet and sanctions-adjacent fields)

**4. Automated eval harness.** Today validation is manual, reading four outputs by eye. Once structured output exists, run all cases on every prompt or tool change and assert `risk_level` against an expected value per case.

---

## What changes when this is live and at scale

The *shape* of validation doesn't change. Three things scale up together:

**Statistical rigor.** Four hand-built cases prove the mechanics. Production needs a large, stratified backtest across case types, segments, and time periods, including the messy middle cases that don't fit one clean pattern, because that's where agent-vs-ground-truth disagreement actually shows up.

**Infrastructure.** Eyeballing outputs gives way to automated evals triggered on every prompt or tool change, logging of every agent recommendation alongside the human decision (so override rate is measurable), scheduled drift monitoring (including shifts in the agent's own tool-selection behavior when the underlying model is updated), and monitoring of vendor-failure rates independent of how gracefully the agent handled them.

**Governance.** Each validation stage gets a named owner and a formal gate: shadow backtest reviewed by model risk, any newly discovered signal routed through the same feature-governance process as any other proposed model input (including disparate-impact review for lending contexts), and rollout expansion treated as a documented decision.

**Unchanged at any scale:** don't trust a result until it's checked against ground truth, and "it worked once" is not "it works."

### Agent build lifecycle (a lighter CRISP-DM analog)

| Stage | CRISP-DM analog | Note |
| :---- | :---- | :---- |
| Goal and scope | Business Understanding | Define the augmentation boundary: what the agent recommends vs. what the decision process decides |
| Tool and data understanding | Data Understanding | What's mockable vs. needs real integration |
| Tool and prompt design | Data Preparation | Agent-specific: designing the interface the model reasons through |
| Build the loop | Modeling | The deterministic-software portion |
| Eval | Evaluation | Not a one-time gate; reruns on every prompt or tool change |
| Guardrails and governance | (none) | Human checkpoints, audit logging, version control |
| Staged deployment | Deployment | Shadow → alpha → staged rollout |
| Monitoring and iteration | Feedback loop | Tighter cycle: a prompt tweak can shift behavior like a retrain would |

---

## Cost reference (prototype scale)

Roughly 1,500–2,000 input tokens and 300–400 output tokens per case end to end, which is on the order of a cent or less per case at mid-tier model pricing. A full afternoon of iterating costs well under a dollar. At production scale, tokens are rarely the main cost. Engineering integration, monitoring, re-validation after every prompt or model change, and the cost of a wrong decision dominate.

---

## Limitations (stated plainly)

- All data is mock, hand-written for this exercise. No real customer, vendor, or institutional data is used.
- The prototype is a single agent with two tools. It has not been run against real systems or at production volume.
- The agent produces a recommendation for human review; it is not designed to make or trigger decisions.
- Results above are from a small number of runs. Model output is probabilistic, so repeated runs can vary.

## License

MIT
