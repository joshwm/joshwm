import { promises as fs } from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/dataDir";

const BUDGET_FILE = path.join(DATA_DIR, "budget.json");

/**
 * Daily cap on real FantasyPros API calls. Kept below the account's actual
 * 50/day limit so a handful of requests stay in reserve for manual
 * debugging outside this app.
 */
export const DAILY_BUDGET_LIMIT = Number(process.env.FANTASYPROS_DAILY_LIMIT ?? 45);

interface BudgetState {
  date: string; // YYYY-MM-DD, UTC
  used: number;
  calls: { at: string; endpoint: string }[];
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readState(): Promise<BudgetState> {
  try {
    const raw = await fs.readFile(BUDGET_FILE, "utf-8");
    const state = JSON.parse(raw) as BudgetState;
    if (state.date === todayKey()) return state;
  } catch {
    // no file yet, or unreadable -> start fresh
  }
  return { date: todayKey(), used: 0, calls: [] };
}

async function writeState(state: BudgetState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(BUDGET_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function getBudgetStatus(): Promise<{
  used: number;
  limit: number;
  remaining: number;
  date: string;
}> {
  const state = await readState();
  return {
    used: state.used,
    limit: DAILY_BUDGET_LIMIT,
    remaining: Math.max(0, DAILY_BUDGET_LIMIT - state.used),
    date: state.date,
  };
}

export class BudgetExceededError extends Error {
  constructor() {
    super(
      `Daily FantasyPros API request budget (${DAILY_BUDGET_LIMIT}) has been used up. Try again after midnight UTC, or raise FANTASYPROS_DAILY_LIMIT.`
    );
    this.name = "BudgetExceededError";
  }
}

/**
 * Reserves one unit of daily budget for a live API call. Throws
 * BudgetExceededError instead of allowing the call when the cap is hit.
 * Call this immediately before making the real HTTP request, never before
 * a cache lookup has already ruled out a cache hit.
 */
export async function spendBudget(endpoint: string): Promise<void> {
  const state = await readState();
  if (state.used >= DAILY_BUDGET_LIMIT) {
    throw new BudgetExceededError();
  }
  state.used += 1;
  state.calls.push({ at: new Date().toISOString(), endpoint });
  await writeState(state);
}
