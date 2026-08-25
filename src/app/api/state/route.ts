import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { respond, unauthorized } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return unauthorized();
  return respond(s);
}
