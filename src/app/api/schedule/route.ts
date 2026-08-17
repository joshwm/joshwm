import { NextRequest, NextResponse } from "next/server";
import { getWeekSchedule } from "@/lib/schedule/service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const season = Number(params.get("season") ?? new Date().getFullYear());
  const week = Number(params.get("week") ?? 1);
  const source = params.get("source") === "mock" ? "mock" : "auto";

  if (!Number.isInteger(week) || week < 1 || week > 18) {
    return NextResponse.json({ error: "week must be 1-18" }, { status: 400 });
  }

  const result = await getWeekSchedule({ season, week }, source);
  return NextResponse.json(result);
}
