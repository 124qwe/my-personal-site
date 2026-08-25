import { NextResponse } from "next/server";
import { toMeDTO, type Session } from "@/lib/auth";
import { getState } from "@/lib/state";

export const dynamic = "force-dynamic";

export function unauthorized() {
  return NextResponse.json(
    { error: "登录状态失效了，重新进入一下" },
    { status: 401 },
  );
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function respond(s: Session) {
  return NextResponse.json(
    await getState(s.couple, toMeDTO(s), s.partnerJoined),
  );
}

export function isHer(s: Session) {
  return s.role === "her";
}
