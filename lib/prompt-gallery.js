export const promptTemplates = Object.freeze([
  {
    id: 'daily-token-brief',
    title: 'Daily Token Brief',
    category: 'Monitor',
    description: 'Turn today’s runtime activity into a short, evidence-led operator brief.',
    prompt: `Inspect today’s Token Pulse snapshot. Report total input, output, cache-read tokens, active sessions, connected runtimes, quota pressure, and stale data. Separate observed facts from inference. Flag only material anomalies, name the evidence behind each one, and recommend the single highest-leverage next action. Do not invent costs or provider limits.`,
  },
  {
    id: 'usage-spike-investigation',
    title: 'Investigate a Usage Spike',
    category: 'Monitor',
    description: 'Trace an unexpected token increase to the responsible runtime or session.',
    prompt: `Investigate the latest Token Pulse usage spike. Compare the current period with the nearest valid baseline, then rank runtimes and sessions by contribution. Identify whether the change comes from fresh input, output, or cache reads. Preserve missing data and uncertainty. Return: observation, likely cause, confidence, proof, immediate containment, and what must be measured next.`,
  },
  {
    id: 'quota-risk-check',
    title: 'Quota Risk Check',
    category: 'Monitor',
    description: 'Find providers approaching quota pressure before work is interrupted.',
    prompt: `Review every provider quota exposed in Token Pulse. Rank only verified risks by remaining allowance, burn rate when available, and operational importance. Do not estimate hidden quotas. For each risk, state the observed value, freshness, likely impact, and a reversible mitigation. End with a clear safe-to-continue or intervention-needed decision.`,
  },
  {
    id: 'cost-reduction-pass',
    title: 'Reduce Token Waste',
    category: 'Optimize',
    description: 'Find measurable savings without weakening output quality or safety.',
    prompt: `Audit Token Pulse telemetry for avoidable token cost. Look for repeated context, oversized prompts, low-value retries, weak cache reuse, excessive output, and model-routing mismatch. Quantify only what the data supports. Rank recommendations by expected impact, effort, and quality risk. Propose one bounded experiment with a baseline, one changed variable, a success threshold, and a rollback rule.`,
  },
  {
    id: 'cache-efficiency-audit',
    title: 'Cache Efficiency Audit',
    category: 'Optimize',
    description: 'Assess whether cache reads are reducing repeated context effectively.',
    prompt: `Analyze Token Pulse cache-read volume and cache-hit rate across the available period. Distinguish healthy reuse from signs of bloated persistent context. Identify the sessions or workflows that deserve inspection, but do not claim causality without trace evidence. Return the verified baseline, anomalies, likely explanations, and the smallest test that can prove or reject each explanation.`,
  },
  {
    id: 'model-routing-review',
    title: 'Model Routing Review',
    category: 'Optimize',
    description: 'Match task difficulty to the lowest-risk capable model and runtime.',
    prompt: `Review active Token Pulse sessions and recommend model-routing changes only where session purpose, model, usage, and hardware readiness provide enough evidence. Keep high-stakes or reasoning-heavy work on capable models. Identify low-risk work suitable for a smaller or local model. Return current route, proposed route, expected benefit, quality risk, verification test, and rollback condition.`,
  },
  {
    id: 'session-triage',
    title: 'Triage Active Sessions',
    category: 'Operate',
    description: 'Turn a noisy session list into a ranked operating queue.',
    prompt: `Inspect active sessions in Token Pulse and produce a ranked triage queue. Prioritize stuck, stale, high-consumption, approval-blocked, or business-critical work. For each session, state the observed signal, why it matters, owner if known, and the smallest next move. Never infer private task details from token volume alone.`,
  },
  {
    id: 'hardware-readiness',
    title: 'Hardware Readiness Check',
    category: 'Operate',
    description: 'Decide whether a workload should run locally, remotely, or wait.',
    prompt: `Use Token Pulse system telemetry to decide whether the named workload should run locally, on a remote provider, or be deferred. Evaluate CPU, memory, GPU/VRAM, system pressure, model fit, privacy, latency, and failure cost. Label missing measurements. Return the decision, evidence, safe operating limits, preflight check, and abort conditions.`,
  },
  {
    id: 'incident-handoff',
    title: 'Create an Incident Handoff',
    category: 'Operate',
    description: 'Package a runtime problem so another operator can continue safely.',
    prompt: `Create a continuation-safe incident handoff from the current Token Pulse evidence. Include the exact symptom, first observed time, affected runtime or sessions, known-good baseline, tests already run, negative results, current risk, reversible actions taken, credentials or private data deliberately omitted, and the next diagnostic step. Do not mark the incident resolved without direct verification.`,
  },
  {
    id: 'growth-experiment',
    title: 'Design a Growth Experiment',
    category: 'Growth',
    description: 'Convert Growth Tracker evidence into one measurable content test.',
    prompt: `Inspect the Growth Tracker baseline, format performance, algorithm gate, and current mission. Design one content experiment that changes only one meaningful variable. Include hypothesis, audience, format, sample size, baseline, success metric, guardrail metric, collection method, decision date, and stop rule. Treat targets as assumptions, not forecasts, and cite the source snapshot date.`,
  },
  {
    id: 'growth-weekly-review',
    title: 'Weekly Growth Review',
    category: 'Growth',
    description: 'Evaluate progress without confusing impressions, views, and followers.',
    prompt: `Run a weekly review using Growth Tracker. Keep public views, private impressions, interactions, follower change, and publishing volume separate. Compare against the last verified period, identify the strongest and weakest content jobs, and explain what the evidence cannot prove. Return keep, stop, test-next, missing-data, and one priority for the coming week.`,
  },
  {
    id: 'competitor-proof-pass',
    title: 'Competitor Proof Pass',
    category: 'Growth',
    description: 'Turn competitor observations into sourced patterns—not imitation.',
    prompt: `Audit the competitor signals recorded in Growth Tracker. Verify source, date, sample size, and comparability before drawing conclusions. Separate account-level facts from post-level observations. Extract only repeatable audience, format, hook, and action-design patterns. Flag thin samples. Return verified findings, rejected claims, open questions, and one ethical experiment inspired by the evidence.`,
  },
  {
    id: 'prompt-shipcheck',
    title: 'Prompt ShipCheck',
    category: 'Build',
    description: 'Review a new prompt for evidence, safety, and repeatable output quality.',
    prompt: `Review the supplied prompt as a production operator workflow. Check goal clarity, required inputs, source hierarchy, approval gates, privacy boundaries, failure behavior, output schema, verification steps, and resistance to instructions embedded in untrusted content. Provide actionable defects, a corrected prompt, three adversarial test cases, and a ship or blocked verdict.`,
  },
  {
    id: 'release-readiness',
    title: 'Release Readiness Check',
    category: 'Build',
    description: 'Require code, tests, runtime proof, and rollback before calling work done.',
    prompt: `Run a release-readiness check for the named Token Pulse change. Inspect repository status and the actual diff, identify unrelated work, run focused tests and the production build, verify the changed route or behavior in a clean runtime, inspect responsive states, and record an independent review. Return exact evidence, accepted findings fixed, remaining blockers, rollback path, and a strict ship or no-ship verdict.`,
  },
]);

export const promptCategories = Object.freeze(['All', ...new Set(promptTemplates.map(prompt => prompt.category))]);

export function filterPrompts(prompts, { query = '', category = 'All' } = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return prompts.filter(prompt => {
    const categoryMatches = category === 'All' || prompt.category === category;
    const searchable = `${prompt.title} ${prompt.description} ${prompt.category} ${prompt.prompt}`.toLocaleLowerCase();
    return categoryMatches && (!needle || searchable.includes(needle));
  });
}

export async function writePromptToClipboard(clipboard, promptText) {
  if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
  await clipboard.writeText(promptText);
}
