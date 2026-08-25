import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { couples, members, sessions } from "@/db/schema";
import type { MeDTO, Role } from "@/lib/types";

export const COOKIE_NAME = "tiehua_session";
const TTL_DAYS = 60;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeCode(len = 6): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export async function issueSession(
  coupleId: string,
  memberId: string,
  role: Role,
): Promise<void> {
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_DAYS * 86400 * 1000);
  await db.insert(sessions).values({ token, coupleId, memberId, role, expiresAt });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  store.delete(COOKIE_NAME);
}

export type Session = {
  coupleId: string;
  memberId: string;
  role: Role;
  nickname: string;
  couple: typeof couples.$inferSelect;
  partnerJoined: boolean;
};

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      coupleId: sessions.coupleId,
      memberId: sessions.memberId,
      role: sessions.role,
      nickname: members.nickname,
      couple: couples,
    })
    .from(sessions)
    .innerJoin(members, eq(members.id, sessions.memberId))
    .innerJoin(couples, eq(couples.id, sessions.coupleId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const partners = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.coupleId, row.coupleId));

  return {
    coupleId: row.coupleId,
    memberId: row.memberId,
    role: row.role,
    nickname: row.nickname,
    couple: row.couple,
    partnerJoined: partners.length > 1,
  };
}

export function toMeDTO(s: Session): MeDTO {
  return { role: s.role, nickname: s.nickname, memberId: s.memberId };
}
