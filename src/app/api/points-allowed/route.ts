import { NextRequest, NextResponse } from "next/server";
import { getPointsAllowed } from "@/lib/fantasypros/service";
import type { ScoringFormat } from "@/lib/fantasypros/types";

const VALID_SCORING: ScoringFormat[] = ["STD", "HALF", "PPR"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const scoring = (params.get("scoring") as ScoringFormat | null) ?? "PPR";
  const season = Number(params.get("season") ?? new Date().getFullYear());
  const source = params.get("source") === "mock" ? "mock" : "auto";

  if (!VALID_SCORING.includes(scoring)) {
    return NextResponse.json(
      { error: `scoring must be one of ${VALID_SCORING.join(", ")}` },
      { status: 400 }
    );
  }

  const result = await getPointsAllowed({ season, scoring }, source);
  return NextResponse.json(result);
}
