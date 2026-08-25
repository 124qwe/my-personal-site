import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { couples, members } from "@/db/schema";
import { destroySession, getSession, issueSession, makeCode } from "@/lib/auth";
import { ensureTables } from "@/lib/ensure";
import { handleDbError } from "@/lib/http";
import { getState } from "@/lib/state";

export const dynamic = "force-dynamic";

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = makeCode(6);
    const found = await db
      .select({ id: couples.id })
      .from(couples)
      .where(or(eq(couples.code, code), eq(couples.ownerKey, code)))
      .limit(1);
    if (!found[0]) return code;
  }
  return makeCode(8);
}

export async function POST(request: Request) {
  try {
    await ensureTables();
    let body: {
      mode?: string;
      herName?: string;
      hisName?: string;
      code?: string;
      nickname?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式不对" }, { status: 400 });
    }

    if (body.mode === "create") {
      const herName = (body.herName ?? "").trim() || "她";
      const hisName = (body.hisName ?? "").trim() || "他";
      if (herName.length > 12 || hisName.length > 12) {
        return NextResponse.json({ error: "昵称 12 字以内" }, { status: 400 });
      }

      const code = await uniqueCode();
      const ownerKey = await uniqueCode();
      const [couple] = await db
        .insert(couples)
        .values({ code, ownerKey, herName, hisName })
        .returning();
      const [member] = await db
        .insert(members)
        .values({ coupleId: couple.id, role: "her", nickname: herName })
        .returning();

      await issueSession(couple.id, member.id, "her");
      return NextResponse.json(
        await getState(
          couple,
          { role: "her", nickname: herName, memberId: member.id },
          false,
        ),
      );
    }

    if (body.mode === "join") {
      const code = (body.code ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
      if (!/^[A-Z0-9]{5,8}$/.test(code)) {
        return NextResponse.json({ error: "码是 6 位字母数字" }, { status: 400 });
      }

      // 一个输入框，自动判断是「他的邀请码」还是「她的登录码」
      const found = await db
        .select()
        .from(couples)
        .where(or(eq(couples.code, code), eq(couples.ownerKey, code)))
        .limit(1);
      const couple = found[0];
      if (!couple) {
        return NextResponse.json({ error: "没找到这个码，再核对一下" }, { status: 404 });
      }

      const role: "her" | "his" = couple.ownerKey === code ? "her" : "his";

      // 她换设备登录：直接复用已有的 her 成员，不新建、不改昵称
      if (role === "her") {
        const herMember = (
          await db
            .select()
            .from(members)
            .where(and(eq(members.coupleId, couple.id), eq(members.role, "her")))
            .limit(1)
        )[0];

        if (!herMember) {
          return NextResponse.json(
            { error: "这个账本的管理员不见了，请重新创建" },
            { status: 404 },
          );
        }

        await issueSession(couple.id, herMember.id, "her");

        const partnerJoined =
          (
            await db
              .select({ id: members.id })
              .from(members)
              .where(eq(members.coupleId, couple.id))
          ).length > 1;

        return NextResponse.json(
          await getState(
            couple,
            { role: "her", nickname: herMember.nickname, memberId: herMember.id },
            partnerJoined,
          ),
        );
      }

      // 他用邀请码进来：首次创建成员，之后是换设备登录
      const nickname = (body.nickname ?? "").trim().slice(0, 12) || couple.hisName;

      const existing = await db
        .select()
        .from(members)
        .where(and(eq(members.coupleId, couple.id), eq(members.role, "his")))
        .limit(1);

      const member = existing[0]
        ? (
            await db
              .update(members)
              .set({ nickname })
              .where(eq(members.id, existing[0].id))
              .returning()
          )[0]
        : (
            await db
              .insert(members)
              .values({ coupleId: couple.id, role: "his", nickname })
              .returning()
          )[0];

      await issueSession(couple.id, member.id, "his");

      const partnerJoined =
        (
          await db
            .select({ id: members.id })
            .from(members)
            .where(eq(members.coupleId, couple.id))
        ).length > 1;

      return NextResponse.json(
        await getState(
          couple,
          { role: "his", nickname, memberId: member.id },
          partnerJoined,
        ),
      );
    }

    return NextResponse.json({ error: "mode 只能是 create 或 join" }, { status: 400 });
  } catch (err) {
    return handleDbError(err) ?? (() => { throw err; })();
  }
}

/** 退出登录 */
export async function DELETE() {
  try {
    const s = await getSession();
    await destroySession();
    return NextResponse.json({ ok: true, wasSignedIn: !!s });
  } catch (err) {
    return handleDbError(err) ?? NextResponse.json({ ok: true });
  }
}
