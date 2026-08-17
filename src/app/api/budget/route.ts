import { NextResponse } from "next/server";
import { getBudgetStatus } from "@/lib/fantasypros/budget";

export async function GET() {
  const status = await getBudgetStatus();
  return NextResponse.json(status);
}
