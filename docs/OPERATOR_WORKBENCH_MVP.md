# Operator Workbench — MVP Product Contract

## Main outcome

Turn verified Token Pulse and Growth Command evidence into reusable operating playbooks that explain what to do, what evidence is required, and where Dad must approve a consequential action.

The product loop is:

`live signal → recommended outcome → inspectable playbook → proof requirement → approval gate → measured result`

## Product boundaries

### Token Pulse owns

- Local-first runtime and token telemetry.
- Provider/session freshness and resource-pressure evidence.
- Read-only alerts and optimization signals.
- No remote execution from the mobile dashboard.

### Growth Command owns

- X growth mission, format analysis, competitors, experiment backlog, metric definitions, and source status.
- Experiment result and 10K mission measurement.
- Approval-gated publishing remains outside the dashboard.

### Operator Workbench owns

- Outcome-first discovery of reusable playbooks.
- Trigger, evidence, integration, cadence, approval, and success contracts.
- Copyable prompts and implementation-ready procedures.
- Routing from signals to the correct product surface.

It does not own raw telemetry, campaign analytics, posting, purchasing, deletion, or external account mutation.

## FDE acceptance evidence for the first vertical slice

1. `/operator` exists as a responsive protected product surface.
2. `/api/operator` rejects requests without an encrypted private-device session.
3. The API returns three explicit product surfaces and at least six inspectable playbooks.
4. Users can filter by Work/Personal and search by outcome, integration, or trigger.
5. A playbook can expand to show sources, trigger, steps, proof, approval gate, cadence, success measure, and exact copyable prompt.
6. The UI never implies that an external action ran. It labels execution as read-only/manual for this slice.
7. No access key, prompt history, telemetry, credential, or private source record is persisted in browser storage.
8. Behavior tests, production build, diff check, and rendered mobile/desktop visual QA pass.

## Initial execution boundary

This MVP is a read-only operator library. Copying a playbook is a local browser action. Sending, publishing, deleting, purchasing, changing permissions, and modifying external systems require a later allowlisted execution layer with explicit Dad approval and an audit receipt.

## Next integration seams

- Token Pulse may emit a privacy-redacted signal envelope: `signalId`, `kind`, `severity`, `observedAt`, aggregate values, freshness, and source status.
- Growth Command may emit an experiment envelope: `experimentId`, hypothesis, status, evidence window, measured result, and next decision.
- Operator Workbench may create an execution proposal: `playbookId`, bound evidence IDs, proposed steps, approval requirements, and expected proof.
- A future executor may accept only signed, allowlisted proposals and must return an immutable receipt. No executor is part of this MVP.

## Verification record — 2026-07-22

- `npm test`: PASS — 33 tests, 33 passed, 0 failed.
- `npm run build`: PASS — Next.js 16.2.10 production build; `/operator` static route and `/api/operator` dynamic route emitted.
- Auth/API browser proof: PASS — secure `__Host-token-pulse-session` cookie and authenticated `/api/operator` HTTP 200 readback.
- Desktop render: PASS — 8/8 playbooks at 1440×1200; no document-level horizontal overflow; no browser runtime exceptions.
- Mobile render: PASS — 8/8 playbooks at 390×844; no document-level horizontal overflow; no browser runtime exceptions.
- `git diff --check`: PASS. The repository already contained Growth/session work, so the worktree status is not an Operator-only change list.
- Durable proof:
  - `operator-workbench-proof.json`
  - `operator-workbench-proof.png`
  - `operator-workbench-proof-mobile.png`

### Observed visual polish debt

1. Collapsed playbook cards use a short height while retaining the title, which clips longer titles on desktop and mobile.
2. The mobile five-stage strip clips the right edge of `Result`; it needs a tighter layout or an explicit accessible horizontal-scroll treatment.

These defects do not block authentication, API readback, filtering, card expansion, or responsive rendering, but they should be fixed before calling the surface production-polished.
