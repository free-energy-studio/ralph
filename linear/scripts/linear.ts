#!/usr/bin/env bun
/**
 * Linear CLI — powered by @linear/sdk
 * Usage: bun linear.ts <command> [args...]
 */

import { LinearClient, LinearDocument } from "@linear/sdk";

const apiKey = process.env.LINEAR_API_KEY;
if (!apiKey) {
  console.error("ERROR: LINEAR_API_KEY not set");
  process.exit(1);
}

const linear = new LinearClient({ apiKey });
const DEFAULT_TEAM = process.env.LINEAR_DEFAULT_TEAM ?? "DOMA";

const [, , cmd = "help", ...args] = process.argv;

// ── helpers ──────────────────────────────────────────────────────────────────

async function getTeamId(key: string = DEFAULT_TEAM): Promise<string> {
  const teams = await linear.teams();
  const team = teams.nodes.find((t) => t.key === key);
  if (!team) {
    const keys = teams.nodes.map((t) => t.key).join(", ");
    throw new Error(`Team "${key}" not found. Available: ${keys}`);
  }
  return team.id;
}

async function resolveIssue(identifier: string) {
  const [teamKey, numStr] = identifier.toUpperCase().split("-");
  const num = parseInt(numStr);
  if (!teamKey || isNaN(num)) throw new Error(`Invalid issue identifier: ${identifier}`);
  const result = await linear.issues({
    filter: { number: { eq: num }, team: { key: { eq: teamKey } } },
  });
  const issue = result.nodes[0];
  if (!issue) throw new Error(`Issue ${identifier} not found`);
  return issue;
}

function priorityLabel(p: number) {
  return ["None", "Urgent", "High", "Medium", "Low"][p] ?? "Unknown";
}

function priorityNum(name: string): number {
  const map: Record<string, number> = { urgent: 1, high: 2, medium: 3, low: 4, none: 0 };
  const n = map[name.toLowerCase()];
  if (n === undefined) throw new Error(`Unknown priority: ${name}. Use: urgent|high|medium|low|none`);
  return n;
}

async function getStateId(teamId: string, stateName: string): Promise<string> {
  const aliases: Record<string, string> = {
    todo: "Todo",
    progress: "In Progress",
    "in-progress": "In Progress",
    review: "In Review",
    "in-review": "In Review",
    done: "Done",
    blocked: "Blocked",
    backlog: "Backlog",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };
  const resolved = aliases[stateName.toLowerCase()] ?? stateName;
  const states = await linear.workflowStates({
    filter: { team: { id: { eq: teamId } }, name: { eq: resolved } },
  });
  const state = states.nodes[0];
  if (!state) throw new Error(`State "${stateName}" not found for team`);
  return state.id;
}

function formatIssue(i: { identifier: string; title: string; state?: { name: string } | null; priority: number; assignee?: { name: string } | null }) {
  const pri = priorityLabel(i.priority);
  const state = i.state?.name ?? "?";
  const who = i.assignee?.name ? ` → ${i.assignee.name}` : "";
  return `[${pri}] ${i.identifier}: ${i.title} (${state})${who}`;
}

// ── commands ─────────────────────────────────────────────────────────────────

async function cmdMyIssues() {
  const me = await linear.viewer;
  const issues = await me.assignedIssues({
    filter: { state: { type: { nin: ["completed", "canceled"] } } },
    first: 25,
  });
  if (!issues.nodes.length) { console.log("No open assigned issues."); return; }
  for (const i of issues.nodes) {
    const state = await i.state;
    const assignee = await i.assignee;
    console.log(formatIssue({ ...i, state, assignee }));
  }
}

async function cmdTeam(teamKey?: string) {
  const teamId = await getTeamId(teamKey);
  const team = await linear.team(teamId);
  const issues = await team.issues({
    filter: { state: { type: { nin: ["completed", "canceled"] } } },
    first: 30,
  });
  if (!issues.nodes.length) { console.log("No open issues."); return; }
  for (const i of issues.nodes) {
    const state = await i.state;
    const assignee = await i.assignee;
    console.log(formatIssue({ ...i, state, assignee }));
  }
}

async function cmdIssue(identifier: string) {
  const i = await resolveIssue(identifier);
  const [state, assignee, project, team, comments] = await Promise.all([
    i.state,
    i.assignee,
    i.project,
    i.team,
    i.comments({ first: 5 }),
  ]);
  console.log(`\n${i.identifier}: ${i.title}`);
  console.log(`State: ${state?.name ?? "?"} | Priority: ${priorityLabel(i.priority)} | Assignee: ${assignee?.name ?? "Unassigned"}`);
  console.log(`Project: ${project?.name ?? "None"} | Team: ${team?.name ?? "?"}`);
  console.log(`Created: ${i.createdAt.toISOString().split("T")[0]}${i.dueDate ? ` | Due: ${i.dueDate}` : ""}`);
  console.log(`URL: ${i.url}`);
  if (i.description) console.log(`\n${i.description}`);
  if (comments.nodes.length) {
    console.log("\n─── Comments ───");
    for (const c of comments.nodes) {
      const user = await c.user;
      console.log(`[${user?.name ?? "?"}]: ${c.body}`);
    }
  }
}

async function cmdCreate(title: string, description?: string, teamKey?: string) {
  if (!title) throw new Error("Usage: create <title> [description] [--team TEAM_KEY]");
  const teamId = await getTeamId(teamKey);
  const result = await linear.createIssue({ teamId, title, description });
  const issue = await result.issue;
  if (!issue) throw new Error("Issue creation failed");
  console.log(`Created: ${issue.identifier} — ${issue.title}\n${issue.url}`);
}

async function cmdComment(identifier: string, body: string) {
  if (!identifier || !body) throw new Error("Usage: comment <TEAM-123> <text>");
  const issue = await resolveIssue(identifier);
  await linear.createComment({ issueId: issue.id, body });
  console.log(`Comment added to ${identifier}`);
}

async function cmdStatus(identifier: string, stateName: string) {
  if (!identifier || !stateName) throw new Error("Usage: status <TEAM-123> <todo|progress|review|done|blocked|backlog>");
  const issue = await resolveIssue(identifier);
  const team = await issue.team;
  const stateId = await getStateId(team!.id, stateName);
  await linear.updateIssue(issue.id, { stateId });
  const updated = await resolveIssue(identifier);
  const state = await updated.state;
  console.log(`Updated ${identifier} → ${state?.name}`);
}

async function cmdPriority(identifier: string, priorityName: string) {
  if (!identifier || !priorityName) throw new Error("Usage: priority <TEAM-123> <urgent|high|medium|low|none>");
  const issue = await resolveIssue(identifier);
  const priority = priorityNum(priorityName);
  await linear.updateIssue(issue.id, { priority });
  console.log(`Updated ${identifier} → ${priorityLabel(priority)}`);
}

async function cmdAssign(identifier: string, userName: string) {
  if (!identifier || !userName) throw new Error("Usage: assign <TEAM-123> <username>");
  const issue = await resolveIssue(identifier);
  const users = await linear.users({ filter: { name: { containsIgnoreCase: userName } } });
  const user = users.nodes[0];
  if (!user) throw new Error(`User "${userName}" not found`);
  await linear.updateIssue(issue.id, { assigneeId: user.id });
  console.log(`Assigned ${identifier} → ${user.name}`);
}

async function cmdUpdate(identifier: string, opts: Record<string, string>) {
  if (!identifier) throw new Error("Usage: update <TEAM-123> --title '...' --description '...' --priority high --status todo");
  const issue = await resolveIssue(identifier);
  const input: Record<string, unknown> = {};
  if (opts.title) input.title = opts.title;
  if (opts.description) input.description = opts.description;
  if (opts.priority) input.priority = priorityNum(opts.priority);
  if (opts.status) {
    const team = await issue.team;
    input.stateId = await getStateId(team!.id, opts.status);
  }
  if (opts.assignee) {
    const users = await linear.users({ filter: { name: { containsIgnoreCase: opts.assignee } } });
    const user = users.nodes[0];
    if (!user) throw new Error(`User "${opts.assignee}" not found`);
    input.assigneeId = user.id;
  }
  await linear.updateIssue(issue.id, input as Parameters<typeof linear.updateIssue>[1]);
  console.log(`Updated ${identifier}`);
}

async function cmdSearch(query: string) {
  if (!query) throw new Error("Usage: search <query>");
  const results = await linear.issueSearch(query, { first: 20 });
  if (!results.nodes.length) { console.log("No results."); return; }
  for (const i of results.nodes) {
    const state = await i.state;
    const assignee = await i.assignee;
    console.log(formatIssue({ ...i, state, assignee }));
  }
}

async function cmdProjects(teamKey?: string) {
  const teamId = await getTeamId(teamKey);
  const team = await linear.team(teamId);
  const projects = await team.projects({ first: 20 });
  if (!projects.nodes.length) { console.log("No projects."); return; }
  for (const p of projects.nodes) {
    const pct = Math.round(p.progress * 100);
    console.log(`${p.name} [${p.state}] — ${pct}% complete${p.targetDate ? ` (due ${p.targetDate})` : ""}`);
  }
}

async function cmdTeams() {
  const teams = await linear.teams();
  for (const t of teams.nodes) console.log(`${t.key}\t${t.name}`);
}

async function cmdStandup() {
  const me = await linear.viewer;
  console.log("=== Daily Standup ===\n");

  const todos = await me.assignedIssues({ filter: { state: { type: { eq: "unstarted" } } }, first: 10 });
  console.log("🎯 YOUR TODOS:");
  for (const i of todos.nodes) {
    const state = await i.state;
    console.log(`  [${priorityLabel(i.priority)}] ${i.identifier}: ${i.title}`);
  }

  const inProgress = await me.assignedIssues({ filter: { state: { type: { eq: "started" } } }, first: 10 });
  console.log("\n🚧 IN PROGRESS:");
  for (const i of inProgress.nodes) {
    const state = await i.state;
    console.log(`  ${i.identifier}: ${i.title} (${state?.name})`);
  }

  const blocked = await linear.issues({
    filter: { state: { name: { in: ["Blocked", "Paused"] } } },
    first: 10,
  });
  console.log("\n🔴 BLOCKED (team-wide):");
  for (const i of blocked.nodes) {
    const assignee = await i.assignee;
    console.log(`  ${i.identifier}: ${i.title} → ${assignee?.name ?? "unassigned"}`);
  }
}

// ── parse flags ───────────────────────────────────────────────────────────────

function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      flags[key] = args[++i] ?? "true";
    } else {
      positional.push(args[i]);
    }
  }
  return { positional, flags };
}

// ── dispatch ──────────────────────────────────────────────────────────────────

const { positional, flags } = parseFlags(args);

try {
  switch (cmd) {
    case "my-issues":   await cmdMyIssues(); break;
    case "team":        await cmdTeam(positional[0] ?? flags.team); break;
    case "teams":       await cmdTeams(); break;
    case "issue":       await cmdIssue(positional[0]); break;
    case "create":      await cmdCreate(positional[0], positional[1], flags.team); break;
    case "comment":     await cmdComment(positional[0], positional[1]); break;
    case "status":      await cmdStatus(positional[0], positional[1]); break;
    case "priority":    await cmdPriority(positional[0], positional[1]); break;
    case "assign":      await cmdAssign(positional[0], positional[1]); break;
    case "update":      await cmdUpdate(positional[0], flags); break;
    case "search":      await cmdSearch(positional.join(" ")); break;
    case "projects":    await cmdProjects(positional[0] ?? flags.team); break;
    case "standup":     await cmdStandup(); break;
    default:
      console.log(`Linear CLI — @linear/sdk

Commands:
  my-issues                        Your open assigned issues
  team [TEAM_KEY]                  All open issues for a team (default: ${DEFAULT_TEAM})
  teams                            List all teams
  issue <TEAM-123>                 Issue details + comments
  create <title> [desc] [--team]   Create issue
  update <TEAM-123> [--title] [--description] [--priority] [--status] [--assignee]
  comment <TEAM-123> <text>        Add comment
  status <TEAM-123> <state>        Update status (todo|progress|review|done|blocked|backlog)
  priority <TEAM-123> <level>      Set priority (urgent|high|medium|low|none)
  assign <TEAM-123> <user>         Assign to user
  search <query>                   Search issues
  projects [TEAM_KEY]              List projects with progress
  standup                          Daily standup summary`);
  }
} catch (err: unknown) {
  console.error("ERROR:", err instanceof Error ? err.message : err);
  process.exit(1);
}
