---
name: hackathon-ideator
description: Generates scoped, research-backed hackathon project ideas by reverse-engineering the actual judging rubric instead of free-associating from the theme. Runs every candidate idea through problem-significance, market-saturation, scope, demo-ability, demo-fragility, growth-path, and sponsor-track/tech-fit checks before it is shown, then returns 2 to 3 ranked ideas with explicit cut lines rather than a long list. Use this whenever the user is choosing or brainstorming what to build for a hackathon, mentions a hackathon theme, prompt, sponsor tracks, or judging rubric, is deciding between hackathon project ideas, or wants to maximize their odds of actually winning a hackathon, even if they never use the words scoped or research-backed.
---

# Hackathon Ideator

## Why this exists

Most idea generation free-associates from a theme and hands back whatever sounds impressive. That optimizes for the wrong variable. Across hackathon judging guides, overscoping (not lack of ambition) is consistently cited as the top reason projects fail, and judging weight distributions vary enormously between events — one real hackathon scored "real world utility" at nearly four times the weight of "technical innovation." A generic idea generator that doesn't know this ends up ranking ideas by how cool they sound instead of how likely they are to actually win.

This skill reverses the order: figure out what's actually being scored first, then only surface ideas that are provably scoped, demoable, and built on a real problem. Never generate ideas first and hope they hold up.

## Step 0: Gather inputs

Before generating any ideas, get these from the user. If more than one or two are missing, ask a single consolidated question rather than guessing — bad inputs here produce confidently wrong ideas.

- **Theme/prompt and sponsor tracks** for this specific hackathon
- **Published judging rubric**, if one exists (verbatim, a link, or a screenshot). If none exists, use the fallback categories below.
- **Scope**: global/national vs. local/campus. This changes what counts as a meaningful problem, not just how much it's worth.
- **Format**: synchronous (live pitch + demo) vs. asynchronous/online (submitted video + written description, usually with no live Q&A).
- **Time limit** and **team size** (solo builders need a harder scope ceiling than teams).
- **Tools/stack already known** by the builder(s). New framework + new teammate + new problem domain stacked together is a well-documented way to run out of time.

## Fallback judging categories

When there is no published rubric, decompose the idea against the categories that repeat across nearly every hackathon judging guide: **technical execution, design/UX, originality, feasibility, impact, and presentation**. Always add **problem clarity/relevance** as an implicit checkpoint too, even when it is not a named category — judges reward it heavily regardless of whether the rubric spells it out. Also add **growth path** (a believable route from hackathon prototype to real product) as its own implicit checkpoint, distinct from impact — impact asks whether the problem matters, growth path asks whether this particular build could plausibly keep going after the weekend ends.

## The process

### 1. Decompose the rubric into weighted checkpoints
Don't treat every category as equally weighted by default. Infer or ask which the specific hackathon actually cares about most — a corporate/hiring-oriented hackathon usually weights technical execution and code quality harder; a social-impact hackathon usually weights real-world impact and problem clarity harder.

### 2. Problem gate — check this before scope or demo-ability
Reject or flag any candidate that can't answer, in one sentence: who is affected, and why would they feel this?
- **Corroborate it's real, don't just assert it.** Before an idea counts as passing this gate, find actual evidence the problem exists — GitHub issues/discussions, forum threads (Reddit, HN, Stack Overflow), complaint patterns in reviews, or similar. A plausible-sounding problem with zero findable evidence of anyone actually hitting it is a flag, not a pass — note that explicitly rather than letting the idea advance on vibes.
- **Global/large-scale event**: favor a problem tied to a broad trend, a large affected population, or a real industry use case.
- **Local/campus event**: favor something narrow enough that the judges in the room will personally recognize the pain — hyper-local specificity beats an abstract global pitch here.
- A technically weaker project with an undeniable problem beats a polished one solving a manufactured problem. Don't let an idea skip this gate just because it sounds impressive.

### 3. Market saturation check
Before an idea can advance, search for existing solutions — shipped products, open-source repos, and prior hackathon projects solving the same problem. This isn't a disqualifier by default; most good problems already have some existing attempts. What matters is whether the candidate has a genuine differentiator once those are known.
- Do the research: search for the problem + "app"/"tool"/"extension", check GitHub/Product Hunt/devpost for prior art, not just a single generic web search.
- If close prior art exists, require a one-sentence differentiator that's substantive (a different mechanism, audience, integration point, or workflow step the existing solutions skip) — not cosmetic (better UI, "but simpler").
- If no genuine differentiator can be stated, cut the idea rather than forcing one.
- If the space is saturated with many well-funded/polished competitors (even with a real differentiator), flag that as a risk factor to weigh at scoring — judges who know the space will ask "why not just use X."
- Note what's found either way, so the builder can address prior art proactively in the pitch instead of getting blindsided by a judge's question.

### 4. Scope + demo gate
Reject or flag any candidate that fails either:
- **One-sentence test**: the core feature must be statable in one sentence. If it takes a paragraph, it's too broad.
- **Demo test**: it must be demoable/showable-working in under 3 minutes.

Calibrate the bar:
- **Solo builder**: realistic scope is roughly half the total time available (for example, about 12 to 15 hours of real work inside a 24-hour event). With no teammate to pressure-test the idea, have the builder generate it from the perspective of the actual affected person, not as an outsider designing a solution for them.
- **Team**: scope scales up, but the discipline is the same — one feature that fully works beats five that half work.
- **Async/online format**: the "demo" is a self-contained video. It must show the product actually running, not narrate slides. The written submission must also stand alone, since there is typically no live Q&A afterward to clarify anything.
- **Sync/in-person format**: optimize for a live 3-to-5-minute demo that can survive follow-up questions.
- **Instant-legibility check**: a judge should understand what the product does within the first 60 seconds of seeing it, before any explanation. If the core value needs a paragraph of setup to land, flag it — this is a separate failure mode from the one-sentence test above (that's about the builder being able to state it; this is about the *demo* communicating it cold).
- **Demo-fragility check**: flag any candidate whose core demo path depends on a live third-party API, network condition, or other flaky external factor (rate limits, latency, uptime) that could visibly fail mid-pitch. Not a disqualifier, but note it explicitly so the builder plans a cached/fallback response for that exact moment instead of finding out live.

### 5. Track-fit and tech-fit check
Note which sponsor/prize tracks the idea could genuinely qualify for. Multi-track qualification raises expected value at no extra core-scope cost. But count only natural, meaningful integration — judges can tell when a sponsor tool is bolted on to check a box, and it tends to cost more on originality and execution than it gains on track-fit.

This applies to the idea's core tech choices too, not just track-qualifying ones. Judges have seen enough projects that bolt on a trendy technology (an LLM chatbot wrapper, a blockchain layer) with no real reason it needs to be there. For each major piece of tech the idea leans on, the candidate needs a one-sentence reason it's the right tool for *this* problem — not just that it's available, impressive-sounding, or track-qualifying. If the only justification is "judges will like seeing X," flag it as a genuine-fit risk rather than counting it as a strength.

### 6. Score and rank
Score every candidate that survives steps 2 through 5 against the weighted checkpoints from step 1. Return the **top 2 to 3 ideas only** — never a long list. For each, give:
- The one-sentence problem (who + why)
- The one-sentence core feature
- The score/rationale tied explicitly to the rubric weights, not vibes
- A **cut line**: what's in the core demo path vs. the first thing to drop if time gets tight

### 7. Constraint audit
Before finalizing, check each surviving idea for constraints the builder is imposing that the brief never actually required — "must run fully offline," "must avoid all external APIs," and similar self-imposed rules are a common and avoidable way to cap a project's ceiling. Flag them explicitly and ask whether they're actually required or just assumed.

## Output format

Present the surviving ideas as a short ranked list, not prose paragraphs. Never return more than 3. If every candidate fails the gates, say so directly rather than lowering the bar to force a list — a shortlist of nothing is more useful than a shortlist of ideas that will lose.

**Example (illustrative, not a template to copy verbatim):**

Idea: Class-swap, a peer-to-peer course-seat trading board for students stuck on a waitlist
- Problem: students at this campus regularly get shut out of required courses by registration timing, not by lack of interest
- Core feature: post a seat you don't need, claim one that's open, single approval step
- Scores well on: impact (concrete, felt weekly by this exact audience), feasibility (CRUD app, no novel tech)
- Cut line: core demo path is post-and-claim only; drop notifications and waitlist ranking first if short on time
