import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/fantasypros/service";
import type { Position, ScoringFormat, WeekSelector } from "@/lib/fantasypros/types";

const VALID_POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];
const VALID_SCORING: ScoringFormat[] = ["STD", "HALF", "PPR"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const position = params.get("position") as Position | null;
  const scoring = (params.get("scoring") as ScoringFormat | null) ?? "PPR";
  const weekParam = params.get("week") ?? "draft";
  const season = Number(params.get("season") ?? new Date().getFullYear());
  const source = params.get("source") === "mock" ? "mock" : "auto";

  if (!position || !VALID_POSITIONS.includes(position)) {
    return NextResponse.json(
      { error: `position must be one of ${VALID_POSITIONS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!VALID_SCORING.includes(scoring)) {
    return NextResponse.json(
      { error: `scoring must be one of ${VALID_SCORING.join(", ")}` },
      { status: 400 }
    );
  }

  const week: WeekSelector = weekParam === "draft" ? "draft" : Number(weekParam);
  if (week !== "draft" && (!Number.isInteger(week) || week < 1 || week > 18)) {
    return NextResponse.json({ error: "week must be 'draft' or 1-18" }, { status: 400 });
  }

  const result = await getStats({ season, week, position, scoring }, source);
  return NextResponse.json(result);
}
